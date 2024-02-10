import * as utils from '../utilities/shared.mjs';

export async function findLineById(id = null) {
  let line = null;

  if (!utils.validateLineID(id)) {
    return line;
  }

  const mockPause = new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 1500);
  });

  const linesArray = [
    { id: 123, text: "Hey TPEN Works on 123" },
  ];

  line = linesArray.find((line) => line.id === id) || null;

  if (line === null) {
    line = await mockPause;
  }

  return line;
}