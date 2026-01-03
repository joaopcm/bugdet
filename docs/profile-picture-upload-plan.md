# Profile Picture Upload - Implementation Plan

## Overview

Allow users to upload, update, and remove their profile picture. The image will be displayed in the navigation sidebar, settings page, and anywhere the user avatar appears.

## Technical Context

- **Database**: `user.image` column already exists (nullable text) - no migration needed
- **Storage**: Supabase Storage (new bucket: `profile-pictures`)
- **Auth**: better-auth with `authClient.useSession()` providing user data including image
- **Pattern**: Follow existing bank statement upload flow (signed URLs, server actions)

---

## Implementation Tasks

### Phase 1: Backend Infrastructure

#### 1.1 Create Supabase Storage Bucket
- [ ] Create `profile-pictures` bucket in Supabase dashboard
- [ ] Configure bucket policies:
  - Public read access for profile pictures (or use signed URLs)
  - Authenticated upload only
  - Max file size: 5MB
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

#### 1.2 Create Users Router (`src/server/routers/users.ts`)
```typescript
// Mutations:
- createProfilePictureUploadUrl: Generate signed upload URL
- updateProfilePicture: Update user.image after successful upload
- removeProfilePicture: Delete image from storage and clear user.image
```

#### 1.3 Create Server Action (`src/server/actions/profile-picture.ts`)
```typescript
- uploadProfilePictureAction: Upload file to signed Supabase URL
```

#### 1.4 Register Router
- [ ] Add `usersRouter` to `src/server/index.ts` app router

---

### Phase 2: Frontend Components

#### 2.1 Create Avatar Component (`src/components/ui/avatar.tsx`)
- [ ] Create shadcn/ui Avatar component using `@radix-ui/react-avatar`
- [ ] Support sizes: `sm` (32px), `md` (40px), `lg` (64px), `xl` (96px)
- [ ] Fallback to user initials when no image
- [ ] Handle loading and error states

#### 2.2 Create Profile Picture Settings (`src/components/settings/profile-picture-settings.tsx`)
- [ ] Card layout matching `TwoFactorSettings` pattern
- [ ] Display current profile picture with Avatar component
- [ ] "Change picture" button to open upload dialog
- [ ] "Remove picture" button (if image exists)

#### 2.3 Create Upload Dialog (`src/components/settings/profile-picture-dialog.tsx`)
- [ ] File input accepting image types
- [ ] Image preview before upload
- [ ] Client-side validation (file type, size)
- [ ] Upload progress indicator
- [ ] Error handling with toast notifications
- [ ] Success feedback and dialog close

#### 2.4 Update Settings Page (`src/app/(app)/(logged-in)/settings/page.tsx`)
- [ ] Add `ProfilePictureSettings` component above `TwoFactorSettings`

#### 2.5 Update Navigation (`src/components/logged-in/nav-user.tsx`)
- [ ] Replace placeholder avatar with Avatar component using `user.image`
- [ ] Ensure real-time update after profile picture change

---

### Phase 3: Image Processing (Optional Enhancement)

#### 3.1 Client-Side Image Optimization
- [ ] Consider using `browser-image-compression` for client-side resize
- [ ] Target max dimensions: 256x256 or 512x512
- [ ] Compress to reduce file size before upload

#### 3.2 Server-Side Processing (Trigger.dev Task)
- [ ] Optional: Create background task for image optimization
- [ ] Generate multiple sizes (thumbnail, medium, large)
- [ ] Convert to WebP for better compression

---

## File Structure

```
src/
├── server/
│   ├── routers/
│   │   └── users.ts                    (NEW - user profile mutations)
│   └── actions/
│       └── profile-picture.ts          (NEW - upload server action)
├── components/
│   ├── ui/
│   │   └── avatar.tsx                  (NEW - reusable avatar)
│   └── settings/
│       ├── profile-picture-settings.tsx    (NEW - settings card)
│       └── profile-picture-dialog.tsx      (NEW - upload dialog)
└── app/(app)/(logged-in)/settings/
    └── page.tsx                        (UPDATE - add profile section)
```

---

## API Design

### tRPC Procedures

```typescript
// src/server/routers/users.ts
export const usersRouter = router({
  // Generate signed URL for profile picture upload
  createProfilePictureUploadUrl: protectedProcedure
    .input(z.object({
      fileType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
      fileSize: z.number().max(5 * 1024 * 1024), // 5MB max
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Delete existing profile picture if exists
      // 2. Generate unique filename: {userId}/{uuid}.{ext}
      // 3. Create signed upload URL from Supabase
      // 4. Return { signedUrl, filePath }
    }),

  // Update user.image after successful upload
  updateProfilePicture: protectedProcedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify file exists in storage
      // 2. Generate public URL
      // 3. Update user.image in database
      // 4. Return updated user
    }),

  // Remove profile picture
  removeProfilePicture: protectedProcedure
    .mutation(async ({ ctx }) => {
      // 1. Get current user.image
      // 2. Delete file from Supabase storage
      // 3. Set user.image to null
      // 4. Return success
    }),
})
```

---

## Security Considerations

1. **File Validation**
   - Validate MIME type on both client and server
   - Check file size limits (5MB max)
   - Validate file extension matches content type

2. **Storage Security**
   - Use signed URLs for uploads (expire after 5 minutes)
   - Store in user-specific folder: `profile-pictures/{userId}/`
   - Delete old picture when uploading new one

3. **Rate Limiting**
   - Limit profile picture uploads to 10 per hour per user
   - Use existing Upstash Redis rate limiter

4. **Content Security**
   - Consider malware scanning for uploaded images
   - Strip EXIF data to remove location info (privacy)

---

## User Experience

### Upload Flow
1. User clicks "Change picture" on settings page
2. Dialog opens with file picker
3. User selects image (drag & drop or click)
4. Preview shown with option to cancel
5. Click "Upload" to start
6. Progress indicator during upload
7. Success toast and dialog closes
8. Avatar updates immediately across the app

### Error Handling
- File too large: "Image must be less than 5MB"
- Invalid type: "Please upload a JPEG, PNG, WebP, or GIF image"
- Upload failed: "Failed to upload image. Please try again."
- Network error: Retry with exponential backoff

---

## Testing Checklist

- [ ] Upload JPEG, PNG, WebP, GIF successfully
- [ ] Reject files larger than 5MB
- [ ] Reject non-image files
- [ ] Old picture deleted when uploading new one
- [ ] Remove picture works correctly
- [ ] Avatar updates in real-time across app
- [ ] Fallback to initials when no image
- [ ] Handle upload interruption gracefully
- [ ] Rate limiting works correctly

---

## Dependencies

No new dependencies required. Existing packages:
- `@radix-ui/react-avatar` - Already installed
- `@supabase/supabase-js` - Already installed
- `sonner` - For toast notifications
- `react-hook-form` - For form handling

Optional for image processing:
- `browser-image-compression` - Client-side image resize/compress

---

## Estimated Scope

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1: Backend | 4 tasks | Medium |
| Phase 2: Frontend | 5 tasks | Medium |
| Phase 3: Optimization | 2 tasks | Low (optional) |

**Total**: ~11 core tasks for full implementation
