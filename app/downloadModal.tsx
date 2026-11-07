import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Directory, File, Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as api from "../queries/fetch/fetchWrapper";
import Button from "@/components/Button";
import DismissModalBar from "@/components/DismissModalBar";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";
import { downloadFileName } from "@/scripts/utils";

// Same formats, order and labels as the web
const FORMATS = [
  { id: "flac", label: "FLAC" },
  { id: "alac", label: "ALAC (Apple Lossless)" },
  { id: "wav", label: "WAV" },
  { id: "128.opus", label: "OPUS 128kbps" },
  { id: "320.mp3", label: "MP3 320kbps" },
  { id: "256.mp3", label: "MP3 256kbps" },
  { id: "128.mp3", label: "MP3 128kbps" },
] as const;

type Format = (typeof FORMATS)[number];
type JobId = string | number;
// true when the zip exists, else the job that builds it
type GenerateResponse = { result: true | { jobId: JobId } };
// A short-lived link to the zip on the storage host
type DownloadResponse = { result: { url: string } | { jobId: JobId } };
type JobsResponse = { results: { jobId: JobId; jobStatus: string }[] };

const POLL_MS = 4000;

// Web DownloadAlbumButton
export default function DownloadModal() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation("translation");
  const { trackGroupId, trackGroupTitle, artist } = useLocalSearchParams<{
    trackGroupId: string;
    trackGroupTitle?: string;
    artist?: string;
  }>();
  const [format, setFormat] = useState<Format | null>(null);
  // Set while the API builds the zip
  const [jobId, setJobId] = useState<JobId | null>(null);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);
  const isOpen = useRef(true);

  useEffect(() => {
    isOpen.current = true;
    return () => {
      isOpen.current = false;
    };
  }, []);

  const reset = useCallback((didFail: boolean) => {
    setFormat(null);
    setJobId(null);
    setReady(false);
    setFailed(didFail);
  }, []);

  const fail = useCallback(
    (err: unknown) => {
      console.error("Issue downloading album", err);
      reset(true);
    },
    [reset],
  );

  useEffect(() => {
    if (!format) return;
    let stale = false;
    (async () => {
      try {
        const { result } = await api.get<GenerateResponse>(
          `/v1/trackGroups/${trackGroupId}/generate?format=${format.id}`,
          {},
        );
        if (stale) return;
        if (result === true) {
          setReady(true);
        } else if (result?.jobId != null) {
          setJobId(result.jobId);
        } else {
          throw new Error("Unexpected generate answer");
        }
      } catch (err) {
        if (!stale) fail(err);
      }
    })();
    return () => {
      stale = true;
    };
  }, [format, trackGroupId, fail]);

  useEffect(() => {
    if (jobId === null) return;
    let stale = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const { results } = await api.get<JobsResponse>(
          `/v1/jobs?queue=generateAlbum&ids=${jobId}`,
          {},
        );
        if (stale) return;
        const status = results[0]?.jobStatus;
        if (status === "failed") throw new Error("The album job failed");
        if (status !== "completed") {
          timer = setTimeout(check, POLL_MS);
          return;
        }
        setJobId(null);
        setReady(true);
      } catch (err) {
        if (!stale) fail(err);
      }
    };
    timer = setTimeout(check, POLL_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [jobId, fail]);

  // The share sheet offers Save to Files, AirDrop and the rest
  const shareZip = async (url: string) => {
    const folder = new Directory(Paths.cache, "downloads");
    folder.create({ idempotent: true, intermediates: true });
    const file = await File.downloadFileAsync(
      url,
      new File(folder, downloadFileName(artist ?? "", trackGroupTitle ?? "")),
      { idempotent: true },
    );
    try {
      if (!isOpen.current) return;
      const { action } = await Share.share({ url: file.uri });
      if (action === Share.sharedAction) router.dismiss();
    } finally {
      file.delete();
    }
  };

  const download = async () => {
    setDownloading(true);
    setFailed(false);
    try {
      const { result } = await api.get<DownloadResponse>(
        `/v1/trackGroups/${trackGroupId}/download?format=${format?.id}`,
        {},
      );
      // The dialog may have closed while the link came
      if (!isOpen.current) return;
      if (result && "jobId" in result) {
        // The zip went missing, build it again
        setReady(false);
        setJobId(result.jobId);
        return;
      }
      if (typeof result?.url !== "string") {
        throw new Error("Unexpected download answer");
      }
      if (Platform.OS === "ios") {
        await shareZip(result.url);
      } else {
        // The browser downloads it with a notification
        await Linking.openURL(result.url);
        router.dismiss();
      }
    } catch (err) {
      console.error("Issue downloading album", err);
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  const downloadLabel = t("trackGroupCard.download");
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar
        title={format ? `${downloadLabel} ${format.label}` : downloadLabel}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {format ? (
          <>
            {ready ? (
              <Button
                title={downloadLabel}
                startIcon={<Ionicons name="download-outline" />}
                onPress={download}
                loading={downloading}
                fullWidth
              />
            ) : (
              <View style={styles.generating}>
                <ActivityIndicator color={colors.accent} />
                <Text style={[type.body, styles.centered]}>
                  {t("trackGroupCard.downloadButtonGenerating")}
                </Text>
              </View>
            )}
            <Button
              variant="outlined"
              title={t("trackGroupCard.chooseAnotherFormat")}
              onPress={() => reset(false)}
              disabled={downloading}
              fullWidth
            />
          </>
        ) : (
          <>
            <Text style={[type.body, styles.centered]}>
              {t("trackGroupCard.downloadFiletypeQuery")}
            </Text>
            {FORMATS.map((option) => (
              <Button
                key={option.id}
                variant="outlined"
                title={option.label}
                onPress={() => setFormat(option)}
                fullWidth
              />
            ))}
          </>
        )}
        {failed ? (
          <Text
            accessibilityRole="alert"
            style={[type.body, styles.centered, { color: colors.danger }]}
          >
            {t("trackGroupCard.downloadFailed")}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  generating: {
    alignItems: "center",
    gap: spacing.md,
  },
  centered: {
    textAlign: "center",
  },
});
