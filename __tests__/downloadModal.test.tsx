/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking, Platform, Share } from "react-native";

const mockGet = jest.fn();
const mockDismiss = jest.fn();
const mockDownloadFile = jest.fn();
const mockDeleteFile = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    trackGroupId: "42",
    trackGroupTitle: "Dronefields",
    artist: "Matt Thys",
  }),
  useRouter: () => ({ dismiss: mockDismiss }),
}));

// Jest resolves the modal's relative import to this same module
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  get: (...args: unknown[]) => mockGet(...args),
}));

jest.mock("expo-file-system", () => {
  const join = (...parts: { uri?: string }[]) =>
    parts.map((part) => part.uri ?? part).join("/");
  class Directory {
    uri: string;
    constructor(...parts: { uri?: string }[]) {
      this.uri = join(...parts);
    }
    create = jest.fn();
  }
  class File {
    static downloadFileAsync = (...args: unknown[]) =>
      mockDownloadFile(...args);
    uri: string;
    constructor(...parts: { uri?: string }[]) {
      this.uri = join(...parts);
    }
  }
  return { Paths: { cache: { uri: "file:///cache" } }, Directory, File };
});

jest.mock("@/components/DismissModalBar", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ title }: { title?: string }) => (
      <Text testID="dismiss-modal-bar">{title}</Text>
    ),
  };
});

// The real icon sets state after its font loads, outside act
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

const importScreen = () => require("@/app/downloadModal").default;

const FORMATS = [
  "FLAC",
  "ALAC (Apple Lossless)",
  "WAV",
  "OPUS 128kbps",
  "MP3 320kbps",
  "MP3 256kbps",
  "MP3 128kbps",
];
const GENERATING = "We're generating the album! Hold on for a minute...";
const FAILED = "Couldn't download the release. Please try again in a moment.";
const URL = "https://storage.example/zip?sig=abc";

const settle = (ms = 0) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

const open = async (format: string) => {
  const Screen = importScreen();
  render(<Screen />);
  fireEvent.press(screen.getByRole("button", { name: format }));
  await settle();
};

const job = (jobStatus: string) => ({ results: [{ jobId: "9", jobStatus }] });

describe("<DownloadModal />", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockDownloadFile.mockResolvedValue({
      uri: "file:///cache/downloads/Matt Thys - Dronefields.zip",
      delete: mockDeleteFile,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    errorSpy.mockRestore();
    Platform.OS = "ios";
  });

  test("the picker lists the seven formats under the question", () => {
    const Screen = importScreen();
    render(<Screen />);

    expect(screen.getByText("Download")).toBeTruthy();
    expect(
      screen.getByText("What file type do you want to download?"),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("button").map((b) => b.props.accessibilityLabel),
    ).toEqual(FORMATS);
  });

  test("a zip that exists shows the Download button under the format title", async () => {
    mockGet.mockResolvedValue({ result: true });
    await open("FLAC");

    expect(mockGet).toHaveBeenCalledWith(
      "/v1/trackGroups/42/generate?format=flac",
      {},
    );
    expect(screen.getByText("Download FLAC")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Choose another format" }),
    ).toBeTruthy();
  });

  test("a job is polled every 4 seconds until it completes", async () => {
    mockGet
      .mockResolvedValueOnce({ result: { jobId: "9" } })
      .mockResolvedValueOnce(job("active"))
      .mockResolvedValueOnce(job("completed"));
    await open("MP3 320kbps");

    expect(mockGet).toHaveBeenLastCalledWith(
      "/v1/trackGroups/42/generate?format=320.mp3",
      {},
    );
    expect(screen.getByText(GENERATING)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Download" })).toBeNull();

    await settle(3999);
    expect(mockGet).toHaveBeenCalledTimes(1);
    await settle(1);
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenLastCalledWith(
      "/v1/jobs?queue=generateAlbum&ids=9",
      {},
    );
    expect(screen.getByText(GENERATING)).toBeTruthy();

    await settle(3999);
    expect(mockGet).toHaveBeenCalledTimes(2);
    await settle(1);
    expect(mockGet).toHaveBeenCalledTimes(3);
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
  });

  test("choosing another format stops the polling", async () => {
    mockGet.mockResolvedValueOnce({ result: { jobId: "9" } });
    await open("WAV");
    fireEvent.press(
      screen.getByRole("button", { name: "Choose another format" }),
    );
    await settle(12000);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("What file type do you want to download?"),
    ).toBeTruthy();
  });

  test("the answer for a format left behind is ignored", async () => {
    let answer!: (value: unknown) => void;
    mockGet
      .mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))
      .mockReturnValueOnce(new Promise(() => undefined));
    await open("FLAC");
    fireEvent.press(
      screen.getByRole("button", { name: "Choose another format" }),
    );
    await act(async () => answer({ result: true }));
    fireEvent.press(screen.getByRole("button", { name: "WAV" }));
    await settle();

    expect(screen.getByText(GENERATING)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Download" })).toBeNull();
  });

  test("a failed job shows the failure under a usable picker", async () => {
    mockGet
      .mockResolvedValueOnce({ result: { jobId: "9" } })
      .mockResolvedValueOnce(job("failed"));
    await open("FLAC");
    await settle(4000);

    expect(screen.getByText(FAILED)).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "FLAC" })).toBeTruthy();
    await settle(12000);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  test("a rejected generate shows the failure", async () => {
    mockGet.mockRejectedValue(new Error("boom"));
    await open("FLAC");

    expect(screen.getByText(FAILED)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "ALAC (Apple Lossless)" }),
    ).toBeTruthy();
  });

  test("iOS saves the zip, shares it and clears the cache", async () => {
    const share = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: Share.sharedAction });
    mockGet
      .mockResolvedValueOnce({ result: true })
      .mockResolvedValueOnce({ result: { url: URL } });
    await open("FLAC");
    fireEvent.press(screen.getByRole("button", { name: "Download" }));
    await settle();

    expect(mockGet).toHaveBeenLastCalledWith(
      "/v1/trackGroups/42/download?format=flac",
      {},
    );
    const [url, file, options] = mockDownloadFile.mock.calls[0];
    expect(url).toBe(URL);
    expect(file.uri).toMatch(/\/downloads\/Matt Thys - Dronefields\.zip$/);
    expect(options).toEqual({ idempotent: true });
    expect(share).toHaveBeenCalledWith({
      url: "file:///cache/downloads/Matt Thys - Dronefields.zip",
    });
    expect(mockDeleteFile).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  test("iOS keeps the dialog when the share sheet is dismissed", async () => {
    jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: Share.dismissedAction });
    mockGet
      .mockResolvedValueOnce({ result: true })
      .mockResolvedValueOnce({ result: { url: URL } });
    await open("FLAC");
    fireEvent.press(screen.getByRole("button", { name: "Download" }));
    await settle();

    expect(mockDeleteFile).toHaveBeenCalledTimes(1);
    expect(mockDismiss).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
  });

  test("iOS skips the share sheet when the dialog closed meanwhile", async () => {
    const share = jest.spyOn(Share, "share");
    let finish!: (file: unknown) => void;
    mockDownloadFile.mockReturnValueOnce(
      new Promise((resolve) => (finish = resolve)),
    );
    mockGet
      .mockResolvedValueOnce({ result: true })
      .mockResolvedValueOnce({ result: { url: URL } });
    await open("FLAC");
    fireEvent.press(screen.getByRole("button", { name: "Download" }));
    await settle();
    screen.unmount();
    await act(async () =>
      finish({ uri: "file:///x.zip", delete: mockDeleteFile }),
    );

    expect(share).not.toHaveBeenCalled();
    expect(mockDeleteFile).toHaveBeenCalledTimes(1);
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  test("Android hands the link to the browser and closes", async () => {
    Platform.OS = "android";
    const openUrl = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    mockGet
      .mockResolvedValueOnce({ result: true })
      .mockResolvedValueOnce({ result: { url: URL } });
    await open("FLAC");
    fireEvent.press(screen.getByRole("button", { name: "Download" }));
    await settle();

    expect(openUrl).toHaveBeenCalledWith(URL);
    expect(mockDownloadFile).not.toHaveBeenCalled();
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  test("a download answered with a job waits for it, bytes count as a failure", async () => {
    mockGet
      .mockResolvedValueOnce({ result: true })
      .mockResolvedValueOnce({ result: { jobId: "9" } })
      .mockResolvedValueOnce(job("completed"))
      .mockResolvedValueOnce("PK zip bytes");
    await open("FLAC");
    fireEvent.press(screen.getByRole("button", { name: "Download" }));
    await settle();
    expect(screen.getByText(GENERATING)).toBeTruthy();

    await settle(4000);
    fireEvent.press(screen.getByRole("button", { name: "Download" }));
    await settle();

    expect(screen.getByText(FAILED)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
    expect(mockDownloadFile).not.toHaveBeenCalled();
  });
});
