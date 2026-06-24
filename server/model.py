import os
import cv2
import numpy as np
import pickle
from ultralytics import YOLO
from state import VIDEO_RESULTS, VIDEO_STORE
from datetime import date
from collections import deque
import warnings

warnings.filterwarnings("ignore")

model  = pickle.load(open("posture_svm_model.pkl", "rb"))
scaler = pickle.load(open("scaler.pkl", "rb"))
le     = pickle.load(open("label_encoder.pkl", "rb"))

person_yolo = YOLO("yolov8n.pt")

fire_model_exists = os.path.exists("best_improved.pt")
if fire_model_exists:
    fire_yolo = YOLO("best_improved.pt")

def angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba, bc = a - b, c - b
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return np.degrees(np.arccos(np.clip(cos, -1, 1))) / 180.0

def p(lm, i):
    return [lm[i].x, lm[i].y]

EPS = 1e-3


def hand_near_mouth(lm, threshold=0.08):
    """
    True if either wrist is close to nose (mouth area).

    Landmarks:
      0  = nose
      11, 12 = shoulders  (scale reference)
      15 = left wrist
      16 = right wrist
    """
    nose    = np.array([lm[0].x,  lm[0].y])
    l_wrist = np.array([lm[15].x, lm[15].y])
    r_wrist = np.array([lm[16].x, lm[16].y])

    shoulder_w = np.linalg.norm(
        np.array([lm[11].x, lm[11].y]) -
        np.array([lm[12].x, lm[12].y])
    ) + 1e-6
    adaptive = np.clip(threshold * (shoulder_w / 0.3), 0.04, 0.15)

    return min(
        np.linalg.norm(l_wrist - nose),
        np.linalg.norm(r_wrist - nose)
    ) < adaptive


def hand_motion_frequent(buf, threshold=0.012):
    """
    True if wrist shows repetitive up-down motion
    (characteristic smoking gesture rhythm).
    """
    if len(buf) < 5:
        return False
    return float(np.mean(np.abs(np.diff(buf)))) > threshold


def smoke_near_person(frame, x1, y1, x2, y2, expand=60):
    """
    Crops an expanded ROI around the person and runs fire_yolo.
    Returns (True, conf) if class 1 (smoke) is found.

    Note: class 0 = fire, class 1 = smoke in your fire model.
    ROI is expanded more upward to catch smoke rising from a cigarette.
    """
    if not fire_model_exists:
        return False, 0.0

    h, w = frame.shape[:2]
    rx1 = max(0, x1 - expand)
    ry1 = max(0, y1 - expand * 2)   # extra upward expansion
    rx2 = min(w, x2 + expand)
    ry2 = min(h, y2 + expand)

    roi = frame[ry1:ry2, rx1:rx2]
    if roi.size == 0:
        return False, 0.0

    for r in fire_yolo(roi, conf=0.30, verbose=False):
        for box in r.boxes:
            if int(box.cls[0]) == 1:            # class 1 = smoke
                return True, float(box.conf[0])

    return False, 0.0


def video_stream(video_path, video_id):

    safe_counts = {
        "SITTING":    0,
        "STANDING":   0,
        "WALKING":    0,
        "MEDITATION": 0
    }
    unsafe_counts = {
        "FIRE":    0,
        "SMOKING": 0,
        "VEHICLE": 0
    }
    safe_confidences   = []
    unsafe_confidences = []

    cap = cv2.VideoCapture(video_path)

    from mediapipe import solutions
    pose = solutions.pose.Pose(static_image_mode=False)

    hip_y_buffer      = deque(maxlen=20)
    l_knee_buffer     = deque(maxlen=10)
    r_knee_buffer     = deque(maxlen=10)
    prediction_buffer = deque(maxlen=20)

    smoking_conf_buffer = deque(maxlen=6)   # keeps same name as before
    l_wrist_y_buf       = deque(maxlen=15)  # NEW: wrist motion tracking
    r_wrist_y_buf       = deque(maxlen=15)  # NEW: wrist motion tracking
    smoking_signal_buf  = deque(maxlen=10)  # NEW: per-frame signal history

    frame_id = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_id += 1
        if fire_model_exists:
            fire_results = fire_yolo(frame, conf=0.4, verbose=False)
            for r in fire_results:
                for box in r.boxes:
                    if int(box.cls[0]) != 0:   # 0 = fire, skip class 1 (smoke)
                        continue
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    unsafe_counts["FIRE"] += 1
                    unsafe_confidences.append(float(box.conf[0]))
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, "FIRE", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        results = person_yolo(frame, conf=0.4, verbose=False)

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # ==================== PERSON ====================
                if cls == 0:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    res = pose.process(rgb)
                    if not res.pose_landmarks:
                        continue
                    lm = res.pose_landmarks.landmark

                    # ╔══════════════════════════════════════════════╗
                    # ║  SMOKING DETECTION  ← ONLY THIS BLOCK NEW   ║
                    # ║  Everything below the continue is UNCHANGED  ║
                    # ╚══════════════════════════════════════════════╝

                    # Signal A: wrist near nose/mouth
                    near_mouth = hand_near_mouth(lm, threshold=0.08)

                    # Signal B: frequent hand motion (every frame)
                    l_wrist_y_buf.append(lm[15].y)
                    r_wrist_y_buf.append(lm[16].y)
                    hand_moving = (
                        hand_motion_frequent(l_wrist_y_buf) or
                        hand_motion_frequent(r_wrist_y_buf)
                    )

                    # Signal C: smoke class near person (every 3rd frame)
                    smoke_near = False
                    smoke_conf = 0.0
                    if frame_id % 3 == 0:
                        smoke_near, smoke_conf = smoke_near_person(
                            frame, x1, y1, x2, y2, expand=60
                        )

                    # Fire: smoking if (hand near mouth + moving)
                    #            OR   (hand near mouth + smoke visible)
                    smoking_signal = (
                        (near_mouth and hand_moving) or
                        (near_mouth and smoke_near)
                    )
                    smoking_signal_buf.append(smoking_signal)

                    if smoking_signal:
                        n = sum([near_mouth, hand_moving, smoke_near])
                        c = min(0.4 + n * 0.2 + smoke_conf * 0.15, 0.99)
                        smoking_conf_buffer.append(c)

                    # Temporal gate: ≥4 positives in last 10 frames
                    smoking_confirmed = (
                        len(smoking_signal_buf)  >= 5            and
                        sum(smoking_signal_buf)  >= 4            and
                        len(smoking_conf_buffer) >= 3            and
                        float(np.mean(smoking_conf_buffer)) > 0.45
                    )

                    if smoking_confirmed:
                        final_conf = float(np.mean(smoking_conf_buffer))
                        unsafe_counts["SMOKING"] += 1
                        unsafe_confidences.append(final_conf)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(
                            frame,
                            f"SMOKING {final_conf*100:.1f}%",
                            (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.8, (0, 0, 255), 2
                        )
                        continue  
                    LH, RH, LK, RK, LA, RA = 23, 24, 25, 26, 27, 28

                    l_knee = angle(p(lm, LH), p(lm, LK), p(lm, LA))
                    r_knee = angle(p(lm, RH), p(lm, RK), p(lm, RA))

                    hip_y   = (lm[LH].y + lm[RH].y) / 2
                    ankle_y = (lm[LA].y + lm[RA].y) / 2

                    hip_y_buffer.append(hip_y)
                    l_knee_buffer.append(l_knee)
                    r_knee_buffer.append(r_knee)

                    hip_y_diff = (
                        hip_y_buffer[-1] - hip_y_buffer[-2]
                        if len(hip_y_buffer) > 1 else 0
                    )
                    velocity        = abs(hip_y_diff)
                    hip_ankle_ratio = hip_y / (ankle_y + 1e-6)

                    features = scaler.transform([[
                        angle(p(lm, 11), p(lm, 13), p(lm, 15)),
                        angle(p(lm, 12), p(lm, 14), p(lm, 16)),
                        angle(p(lm, 13), p(lm, 11), p(lm, 23)),
                        angle(p(lm, 14), p(lm, 12), p(lm, 24)),
                        angle(p(lm, 11), p(lm, 23), p(lm, 25)),
                        angle(p(lm, 12), p(lm, 24), p(lm, 26)),
                        l_knee, r_knee,
                        0, 0, 0,
                        hip_y_diff, 0, 0, 0, 0, 0,
                        velocity, hip_ankle_ratio
                    ]])

                    probs    = model.predict_proba(features)[0]
                    pred_idx = np.argmax(probs)
                    label    = le.inverse_transform([pred_idx])[0]
                    svm_conf = probs[pred_idx]

                    if label == "sitting":
                        if len(l_knee_buffer) > 5:
                            knee_stability = (
                                np.std(l_knee_buffer) + np.std(r_knee_buffer)
                            )
                            hip_stability = np.std(hip_y_buffer)
                        else:
                            knee_stability = hip_stability = 1

                        if (knee_stability < 0.01 and
                                hip_stability  < 0.003 and
                                velocity       < 0.015):
                            safe_counts["MEDITATION"] += 1
                            label = "meditation"

                    if len(l_knee_buffer) > 3:
                        knee_motion = (
                            np.mean(np.abs(np.diff(l_knee_buffer))) +
                            np.mean(np.abs(np.diff(r_knee_buffer)))
                        )
                    else:
                        knee_motion = 0

                    if label == "sitting" and velocity > 0.03 and knee_motion > 0.02:
                        label = "walking"
                    else:
                        safe_counts["SITTING"] += 1

                    if label == "walking" and velocity < 0.03 and knee_motion < 0.02:
                        label = "standing"
                        safe_counts["STANDING"] += 1
                    else:
                        safe_counts["WALKING"] += 1

                    prediction_buffer.append(label)
                    final_label = max(
                        set(prediction_buffer), key=prediction_buffer.count
                    )

                    temporal_conf      = prediction_buffer.count(final_label) / len(prediction_buffer)
                    combined_safe_conf = 0.6 * temporal_conf + 0.4 * svm_conf
                    combined_safe_conf = np.clip(combined_safe_conf, EPS, 1 - EPS)
                    safe_confidences.append(combined_safe_conf)

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame, final_label.upper(), (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2
                    )

                # ==================== VEHICLE (UNCHANGED) ====================
                elif cls in [2, 3]:
                    unsafe_counts["VEHICLE"] += 1
                    unsafe_confidences.append(float(box.conf[0]))
                    label = "CAR" if cls == 2 else "BIKE"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, label, (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        _, buffer = cv2.imencode(".jpg", frame)
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            buffer.tobytes() +
            b"\r\n"
        )

    cap.release()

    # ================= FINAL RESULT (UNCHANGED) =================
    unsafe_types    = [k for k, v in unsafe_counts.items() if v > 0]
    status          = "UNSAFE" if unsafe_types else "SAFE"
    safe_activities = [k for k, v in safe_counts.items() if v > 0]

    avg_safe_conf   = sum(safe_confidences)   / len(safe_confidences)   if safe_confidences   else 0
    avg_unsafe_conf = sum(unsafe_confidences) / len(unsafe_confidences) if unsafe_confidences else 0

    overall_confidence = round(max(avg_safe_conf, avg_unsafe_conf) * 100, 2)
    if not np.isfinite(overall_confidence):
        overall_confidence = 0.0

    user_id = VIDEO_STORE[video_id]["user_id"]

    VIDEO_RESULTS[video_id] = {
        "user_id":          user_id,
        "date":             str(date.today()),
        "status":           status,
        "unsafe_types":     unsafe_types,
        "safe_activities":  safe_activities,
        "counts":           unsafe_counts,
        "confidence_score": overall_confidence
    }


