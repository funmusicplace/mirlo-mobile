export enum State {
  None = "none",
  Ready = "ready",
  Playing = "playing",
  Paused = "paused",
  Stopped = "stopped",
  Loading = "loading",
  Buffering = "buffering",
  Error = "error",
  Ended = "ended",
}

export enum Event {
  PlayerError = "player-error",
  PlaybackState = "playback-state",
  PlaybackError = "playback-error",
  PlaybackQueueEnded = "playback-queue-ended",
  PlaybackActiveTrackChanged = "playback-active-track-changed",
  PlaybackPlayWhenReadyChanged = "playback-play-when-ready-changed",
  PlaybackProgressUpdated = "playback-progress-updated",
  RemotePlay = "remote-play",
  RemotePause = "remote-pause",
  RemoteStop = "remote-stop",
  RemoteNext = "remote-next",
  RemotePrevious = "remote-previous",
  RemoteJumpForward = "remote-jump-forward",
  RemoteJumpBackward = "remote-jump-backward",
  RemoteSeek = "remote-seek",
  RemoteSetRating = "remote-set-rating",
  RemoteDuck = "remote-duck",
  RemoteLike = "remote-like",
  RemoteDislike = "remote-dislike",
  RemoteBookmark = "remote-bookmark",
  RemotePlayId = "remote-play-id",
  RemotePlaySearch = "remote-play-search",
  RemoteSkip = "remote-skip",
  MetadataChapterReceived = "metadata-chapter-received",
  MetadataTimedReceived = "metadata-timed-received",
  MetadataCommonReceived = "metadata-common-received",
}

export enum Capability {
  Play,
  PlayFromId,
  PlayFromSearch,
  Pause,
  Stop,
  SeekTo,
  Skip,
  SkipToNext,
  SkipToPrevious,
  JumpForward,
  JumpBackward,
  SetRating,
  Like,
  Dislike,
  Bookmark,
}

export enum IOSCategory {
  Playback = "playback",
  PlayAndRecord = "playAndRecord",
  MultiRoute = "multiRoute",
  Ambient = "ambient",
  SoloAmbient = "soloAmbient",
  Record = "record",
}

export enum IOSCategoryOptions {
  MixWithOthers = "mixWithOthers",
  DuckOthers = "duckOthers",
  InterruptSpokenAudioAndMixWithOthers = "interruptSpokenAudioAndMixWithOthers",
  AllowBluetooth = "allowBluetooth",
  AllowBluetoothA2DP = "allowBluetoothA2DP",
  AllowAirPlay = "allowAirPlay",
  DefaultToSpeaker = "defaultToSpeaker",
}

export enum AppKilledPlaybackBehavior {
  ContinuePlayback = "continue-playback",
  PausePlayback = "pause-playback",
  StopPlaybackAndRemoveNotification = "stop-playback-and-remove-notification",
}

export enum RepeatMode {
  Off,
  Track,
  Queue,
}

export type PlaybackState = { state: State };

const noop = async () => {};

const TrackPlayer = {
  setupPlayer: noop,
  updateOptions: noop,
  registerPlaybackService: (_factory: () => unknown) => {},
  addEventListener: () => ({ remove: () => {} }),
  add: async () => undefined,
  remove: noop,
  setQueue: noop,
  getQueue: async () => [] as unknown[],
  getActiveTrack: async () => undefined,
  getActiveTrackIndex: async () => undefined,
  skip: noop,
  skipToNext: noop,
  skipToPrevious: noop,
  play: noop,
  pause: noop,
  stop: noop,
  seekTo: noop,
  setRepeatMode: noop,
};

export default TrackPlayer;

export function usePlaybackState() {
  return { state: undefined as State | undefined };
}

export function useProgress() {
  return { position: 0, duration: 0, buffered: 0 };
}

export function useTrackPlayerEvents(
  _events: Event[],
  _handler: (event: never) => void,
) {}
