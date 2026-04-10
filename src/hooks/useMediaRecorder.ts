import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMediaRecorder(roomId: string, patientName: string) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = useCallback((streams: MediaStream[]) => {
    try {
      // Combine all streams into one
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      const videoTracks: MediaStreamTrack[] = [];

      streams.forEach((stream) => {
        stream.getAudioTracks().forEach((t) => {
          const source = audioCtx.createMediaStreamSource(new MediaStream([t]));
          source.connect(dest);
        });
        stream.getVideoTracks().forEach((t) => videoTracks.push(t));
      });

      // Use the remote video track if available, else local
      const combinedStream = new MediaStream([
        ...(videoTracks.length > 0 ? [videoTracks[0]] : []),
        ...dest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000); // chunk every second
      startTimeRef.current = Date.now();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const stopAndUpload = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return null;

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        setIsRecording(false);
        setIsUploading(true);

        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const fileName = `${roomId}_${Date.now()}.webm`;

        try {
          const { error: uploadError } = await supabase.storage
            .from("video-recordings")
            .upload(fileName, blob, { contentType: "video/webm", upsert: false });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            setIsUploading(false);
            resolve(null);
            return;
          }

          const { data: urlData } = supabase.storage
            .from("video-recordings")
            .getPublicUrl(fileName);

          const fileUrl = urlData.publicUrl;

          // Save metadata
          await supabase.from("video_recordings").insert({
            room_id: roomId,
            patient_name: patientName,
            file_url: fileUrl,
            duration_seconds: durationSec,
            file_size_bytes: blob.size,
          });

          setIsUploading(false);
          resolve(fileUrl);
        } catch (err) {
          console.error("Recording save error:", err);
          setIsUploading(false);
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, [roomId, patientName]);

  return { isRecording, isUploading, startRecording, stopAndUpload };
}