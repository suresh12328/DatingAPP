import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { Profile } from '../../types';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: Profile;
  isVideoCall: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  isVideoCall
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCallStatus('calling');
      setDurationSeconds(0);
      setIsMuted(false);
      setIsVideoEnabled(isVideoCall);
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      return;
    }

    // Call progression simulation
    setCallStatus('calling');
    const ringTimeout = setTimeout(() => {
      setCallStatus('ringing');
    }, 1800);

    const connectTimeout = setTimeout(() => {
      setCallStatus('connected');
      timerRef.current = window.setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    }, 4500);

    // If video call, attempt to request local camera for realistic preview
    if (isVideoCall) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            localStreamRef.current = stream;
            setHasCameraPermission(true);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch(() => {
            setHasCameraPermission(false);
          });
      }
    }

    return () => {
      clearTimeout(ringTimeout);
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, isVideoCall]);

  const handleEndCall = () => {
    setCallStatus('ended');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggling to new state
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
  };

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-in fade-in duration-200">
      {/* Top Bar: Caller Info & Status */}
      <div className="w-full max-w-md flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            End-to-End Encrypted
          </span>
        </div>
        <div className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/50">
          {callStatus === 'connected'
            ? formatDuration(durationSeconds)
            : callStatus === 'ringing'
            ? 'Ringing...'
            : callStatus === 'calling'
            ? 'Calling...'
            : 'Call Ended'}
        </div>
      </div>

      {/* Main Center Area: Avatar or Video Stream */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center my-auto">
        {isVideoCall && isVideoEnabled ? (
          <div className="relative w-full aspect-[3/4] max-h-[55vh] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center">
            {/* Target User Remote Video or Avatar representation */}
            <img
              src={targetUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'}
              alt={targetUser.full_name}
              className="w-full h-full object-cover filter brightness-95"
            />

            {/* In-call status overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {targetUser.full_name}
            </div>

            {/* Picture-in-picture local user video */}
            <div className="absolute bottom-4 right-4 w-28 h-40 rounded-2xl overflow-hidden bg-black/80 border-2 border-white/20 shadow-xl">
              {hasCameraPermission ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-zinc-800">
                  <Video className="w-6 h-6 text-zinc-400 mb-1" />
                  <span className="text-[10px] text-zinc-400">You</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audio Call Visualizer */
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              {/* Pulsing ring waves */}
              {callStatus !== 'ended' && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-blue-500/10 animate-pulse" />
                </>
              )}

              <img
                src={targetUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'}
                alt={targetUser.full_name}
                className="relative w-36 h-36 rounded-full object-cover border-4 border-blue-500 shadow-2xl"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white font-heading">
                {targetUser.full_name}
              </h2>
              <p className="text-sm text-blue-400 font-medium">
                {callStatus === 'connected'
                  ? 'LoveConnect HD Audio'
                  : callStatus === 'ringing'
                  ? 'Ringing...'
                  : 'Contacting...'}
              </p>
              {targetUser.location && (
                <p className="text-xs text-zinc-500">
                  {targetUser.location}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md pb-6 flex items-center justify-center gap-5">
        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Video toggle (for video call) or Speaker toggle (for audio call) */}
        {isVideoCall ? (
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
              !isVideoEnabled
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        ) : (
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
              isSpeakerOn
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
            title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-2xl shadow-rose-950/60 active:scale-95 transition"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
