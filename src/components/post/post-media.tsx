import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { Post } from '@/api/types';

type PostMediaProps = {
  post: Post;
  /** True while the post fills the screen. Videos (F16) play only when active. */
  isActive: boolean;
};

/** The post's image, letterboxed on black. Videos show their poster until F16. */
export function PostMedia({ post }: PostMediaProps): React.JSX.Element {
  const { media } = post;
  const label = post.caption || `Post by @${post.author.username}`;

  // Until F16 a video shows its poster frame, which the server stores as the thumbnail.
  const uri = media.kind === 'image' ? media.url : media.thumbnailUrl;

  return (
    <Image
      source={{ uri }}
      placeholder={{ uri: media.thumbnailUrl }}
      placeholderContentFit="contain"
      contentFit="contain"
      transition={150}
      accessibilityLabel={label}
      style={styles.media}
    />
  );
}

export const MEDIA_BACKGROUND = '#000000';

const styles = StyleSheet.create({
  media: {
    ...StyleSheet.absoluteFill,
    backgroundColor: MEDIA_BACKGROUND,
  },
});
