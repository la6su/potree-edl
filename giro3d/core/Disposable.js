/**
 * Trait of objects that hold unmanaged resources.
 */

export function isDisposable(object) {
  if (typeof object.dispose === 'function') {
    return true;
  }
  return false;
}