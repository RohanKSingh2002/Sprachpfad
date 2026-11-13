export const MAX_PROFILE_PHOTO_LENGTH = 96000;

export function validProfilePhoto(value) {
  return typeof value === 'string' && value.length <= MAX_PROFILE_PHOTO_LENGTH &&
    /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : '';
}

export async function prepareProfilePhoto(file) {
  if (file.size > 25 * 1024 * 1024) throw new Error('Choose a picture of 25 MB or less.');
  // A phone's picker can leave the media type blank. Let the image decoder validate the file.
  const type = file.type.toLowerCase();
  if (type && type !== 'application/octet-stream' && !type.startsWith('image/')) throw new Error('Choose a photo from your device.');
  const heic = /^image\/hei[cf](?:-sequence)?$/.test(type) || /\.hei[cf]$/i.test(file.name);
  const unreadable = heic ? 'This browser could not open the HEIC photo. Try a JPG or PNG copy.' : 'This picture could not be opened. Try another image.';
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error(unreadable));
      image.src = url;
    });
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    if (!size) throw new Error(unreadable);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(256, size);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This picture could not be saved. Try another image.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size,
      0, 0, canvas.width, canvas.height);
    const photo = validProfilePhoto(canvas.toDataURL('image/jpeg', 0.82)) || validProfilePhoto(canvas.toDataURL('image/jpeg', 0.66));
    if (!photo) throw new Error('This picture could not be saved. Try another image.');
    return photo;
  } finally { URL.revokeObjectURL(url); }
}
