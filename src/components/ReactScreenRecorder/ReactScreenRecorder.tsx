import { useRef, useState } from 'react'

const defaultButtonContainerPositon: React.CSSProperties = {
    position: 'fixed',
    bottom: "0px",
    right: "0px",
    margin: "1rem"
}

export interface ScreenRecorderProps {
    onRecordingStop: (data: { fileName: string; url: string }) => void;
    recordCurrentScreenOnly?: boolean;
    screenRecorderContainerStyle?: React.CSSProperties;
    customScreenRecorderButtonRender?: (props: {
        status: string;
        startRecording: () => void;
        stopRecording: () => void;
    }) => JSX.Element | null;
    recordAudio?: boolean
}

const ReactScreenRecorder = ({
    onRecordingStop,
    recordCurrentScreenOnly = false,
    screenRecorderContainerStyle = defaultButtonContainerPositon,
    customScreenRecorderButtonRender,
    recordAudio = true
}: ScreenRecorderProps) => {
    const [recordingStatus, setRecordingStatus] = useState("idle")
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const recordedChunks = useRef<Blob[]>([]);

    const hanldeScreenRecord = async () => {
        try {
            const options = {
                audio: recordAudio,
                video: true,
                preferCurrentTab: recordCurrentScreenOnly
            }

            const stream = await navigator.mediaDevices.getDisplayMedia(options)
            createRecorder(stream)

        } catch (error) {
            if (error instanceof Error && error.message === 'Permission denied') {
                setRecordingStatus("idle")
            }

        }



    }

    const createRecorder = (stream) => {
        try {
            const mediaRecorderInstance = new MediaRecorder(stream);
            recordedChunks.current = [];
            setRecordingStatus("recording")

            mediaRecorderInstance.ondataavailable = (event) => {

                if (event.data.size > 0) {
                    recordedChunks.current.push(event.data);
                }
            };

            mediaRecorderInstance.onstop = () => {
                saveFile(recordedChunks.current);
                recordedChunks.current = [];
                setRecordingStatus("idle");
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderInstance.onpause = () => {
                console.log("paused")
            };

            mediaRecorderInstance.onresume = () => {
                console.log("resume")
            };

            mediaRecorderInstance.start(200);
            setMediaRecorder(mediaRecorderInstance);

        } catch (error) {
            console.error('Error creating MediaRecorder:', error instanceof Error ? error.message : error);
            setRecordingStatus("idle");
        }
    }


    const saveFile = (chunks, mimeType = "video/webm") => {
        if (onRecordingStop) {

            const blob = new Blob(chunks, { type: mimeType });
            const now = new Date();
            const year = now.getFullYear();

            const getRandomString = (length = 8) => {
                return Math.random().toString(36).substring(2, 2 + length);
            };

            const fileExtension = mimeType === "video/webm" ? "webm" : "mp4";

            const fileName = `ScreenRecord-${getRandomString()}-${year}.${fileExtension}`;
            const url = URL.createObjectURL(blob)
            onRecordingStop({ fileName, url })
        } else {
            console.warn("onRecordingStop is missing...")
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            recordedChunks.current = [];
        } else {
            console.warn("No active media recorder to stop.");
        }
    };

    return (
        <>
            {
                customScreenRecorderButtonRender ? customScreenRecorderButtonRender({
                    status: recordingStatus, startRecording: hanldeScreenRecord, stopRecording
                }) :
                    <div style={screenRecorderContainerStyle}>
                        {(recordingStatus === "idle" || recordingStatus === "recording") &&
                            <button
                                className={`screen__record__action__btn ${recordingStatus === "recording" ? "recording" : ""}`}
                                onClick={() => {
                                    if (recordingStatus === "idle") {
                                        hanldeScreenRecord()
                                    } else if (recordingStatus === "recording") {
                                        stopRecording()
                                    }
                                }}>
                                {recordingStatus === "recording" ? 'Stop Recording' : null}
                                {recordingStatus === "idle" ? 'Start Recording' : null}
                            </button>
                        }
                    </div>
            }
        </>
    )
}


export default ReactScreenRecorder