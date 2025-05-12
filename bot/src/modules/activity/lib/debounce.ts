const activityTimeout = 1000 * 60 * 5; // 5 minutes

export function isDebounced(set: Set<String>, id: string, duration: number = activityTimeout) {
  // Don't do anything if within 5 minutes of the last message
  if (set.has(id)) return true


  // Add the user to the debounce set and remove them after 5 minutes
  set.add(id);
  setTimeout(() => {
    set.delete(id);
  }, duration);

  return false;
}
