'use client';

import type * as React from 'react';
import {
  ownerAvatarFile,
  personInitials,
  resolveProfileAvatar,
  type ProfileAvatar,
} from '@smartapp/core';
import { Avatar, AvatarFallback, AvatarImage } from '@smartapp/ui/components/avatar';
import { cn } from 'cn';

import { AVATAR_BG, directPhotoSrc } from './avatar-theme';

export { AVATAR_BG, directPhotoSrc };

export interface PersonAvatarProps {
  readonly avatar: ProfileAvatar | null | undefined;
  readonly name: string;
  /** How the app resolves an uploaded photo's file id to a display URL. */
  readonly photoSrc?: ((fileId: string) => string | null) | undefined;
  readonly size?: 'default' | 'sm' | 'lg' | undefined;
  readonly className?: string | undefined;
  /** Optional AvatarBadge (e.g. online dot). */
  readonly badge?: React.ReactNode;
}

/**
 * Shared person picture for owners and members (ported from the food app): preset WebP face,
 * customised SVG face, initials on a theme disc, or uploaded photo. Legacy `preset` values fall
 * back deterministically to a Sketch face so older saved profiles never break.
 */
export function PersonAvatar({
  avatar,
  name,
  photoSrc = directPhotoSrc,
  size,
  className,
  badge,
}: PersonAvatarProps) {
  const resolved = resolveProfileAvatar(avatar);
  const src = resolved.kind === 'photo' ? photoSrc(resolved.file_id) : ownerAvatarFile(resolved);
  const theme =
    resolved.kind === 'photo' ? 'bg-muted text-muted-foreground' : AVATAR_BG[resolved.theme];
  const initials =
    resolved.kind === 'initials' && resolved.text ? resolved.text : personInitials(name) || '?';

  return (
    <Avatar
      data-slot="person-avatar"
      size={size === 'sm' ? 'sm' : 'default'}
      className={cn(theme, size === 'lg' && 'size-16', className)}
    >
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback className={cn('bg-transparent font-semibold', theme)}>
        {initials}
      </AvatarFallback>
      {badge}
    </Avatar>
  );
}

export type PersonPicture =
  | { readonly kind: 'avatar'; readonly avatar: ProfileAvatar | null }
  | { readonly kind: 'file'; readonly src: string };

export function PictureAvatar({
  picture,
  name,
  photoSrc,
  className,
  fileClassName,
}: {
  readonly picture: PersonPicture;
  readonly name: string;
  readonly photoSrc?: ((fileId: string) => string | null) | undefined;
  readonly className?: string | undefined;
  readonly fileClassName?: string | undefined;
}) {
  if (picture.kind === 'avatar') {
    return (
      <PersonAvatar avatar={picture.avatar} name={name} photoSrc={photoSrc} className={className} />
    );
  }
  return (
    <Avatar className={cn(fileClassName, className)}>
      <AvatarImage src={picture.src} alt="" className="object-cover" />
      <AvatarFallback className={cn('font-semibold', fileClassName)}>
        {personInitials(name) || '?'}
      </AvatarFallback>
    </Avatar>
  );
}
