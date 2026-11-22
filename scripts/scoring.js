window.FlagFrenzyScoring = {
  compareCanvases(userCanvas, referenceCanvas, hintUsed = false) {
    const user = userCanvas.getContext("2d").getImageData(0, 0, userCanvas.width, userCanvas.height).data;
    const reference = referenceCanvas.getContext("2d").getImageData(0, 0, referenceCanvas.width, referenceCanvas.height).data;
    let blankError = 0;
    let drawingError = 0;
    for (let i = 0; i < user.length; i += 4) {
      const targetR = reference[i];
      const targetG = reference[i + 1];
      const targetB = reference[i + 2];
      blankError += Math.abs(255 - targetR) + Math.abs(255 - targetG) + Math.abs(255 - targetB);
      drawingError += Math.abs(user[i] - targetR) + Math.abs(user[i + 1] - targetG) + Math.abs(user[i + 2] - targetB);
    }
    const improvement = blankError === 0 ? 0 : Math.max(0, 1 - drawingError / blankError);
    const raw = Math.round(improvement * 100);
    return hintUsed ? Math.round(raw * 0.75) : raw;
  },
};
