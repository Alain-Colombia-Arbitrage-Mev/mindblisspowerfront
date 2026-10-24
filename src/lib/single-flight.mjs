// Shares only an in-flight non-personal load, never a completed response.
export function createSingleFlight(load) {
  let pending = null;
  let generation = 0;
  function read() {
    if (!pending) {
      const current = generation;
      const request = Promise.resolve()
        .then(load)
        .then(
          (result) => (current === generation ? result : read()),
          (error) => {
            if (current !== generation) return read();
            throw error;
          },
        )
        .finally(() => {
          if (pending === request) pending = null;
        });
      pending = request;
    }
    return pending.then(structuredClone);
  }
  return {
    read,
    invalidate() {
      generation++;
      pending = null;
    },
  };
}
