import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { Post } from '@/api/types';
import { VideoPost } from '@/components/post/video-post';

type PostMediaProps = {
  post: Post;
  /** True while the post fills the screen. Videos play only when active. */
  isActive: boolean;
  /** True for the active post and its neighbors. Only these get a video player. */
  isNear: boolean;
};

export const MEDIA_BACKGROUND = '#000000';

/** The post's image or video, letterboxed on black. */
export function PostMedia({ post, isActive, isNear }: PostMediaProps): React.JSX.Element {
  const { media } = post;

  // Far-away videos show only their poster: players are expensive, and
  // Android runs out of decoders with many alive at once.
  if (media.kind === 'video' && isNear && media.status === 'ready') {
    return <VideoPost post={post} isActive={isActive} />;
  }

  return (
    <Image
      source={{ uri: media.kind === 'image' ? media.url : media.thumbnailUrl }}
      placeholder={{ uri: media.thumbnailUrl }}
      placeholderContentFit="contain"
      contentFit="contain"
      transition={150}
      accessibilityLabel={post.caption || `Post by @${post.author.username}`}
      style={styles.media}
    />
  );
}

const styles = StyleSheet.create({
  media: {
    ...StyleSheet.absoluteFill,
    backgroundColor: MEDIA_BACKGROUND,
  },
});
