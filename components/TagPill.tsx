import { Link, useRouter } from "expo-router";
import { useColors } from "@/constants/colors";

type TagPillProps = {
  key: number;
  tagName: string;
};

export default function TagPill({ tagName }: TagPillProps) {
  const router = useRouter();
  const colors = useColors();
  return (
    <Link
      href={{
        pathname: "/tags/[tag]",
        params: { tag: tagName },
      }}
      style={{
        backgroundColor: colors.muted,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 6,
        paddingHorizontal: 15,
        borderRadius: 18,
        marginRight: 5,
        marginVertical: 5,
        color: colors.text,
      }}
      onPress={() => router.back()}
    >
      {tagName}
    </Link>
  );
}
