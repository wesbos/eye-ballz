// this is just a list of generated items so I can reference them


export const photos = {
  norma: {
    filename: 'photos/norma.jpg',
    PREFIX: 'norma',
    X_STEPS: 10,
    Y_STEPS: 10,
  },
  snickers: {
    filename: 'photos/snickers.jpg',
    PREFIX: 'snickers',
    X_STEPS: 10,
    Y_STEPS: 10,
  },
  wes: {
    filename: 'photos/wes-straight-on.jpg',
    PREFIX: 'wes-big',
    X_STEPS: 25,
    Y_STEPS: 25,
  }
}

export type Photo = typeof photos[keyof typeof photos]
export const activePhoto: Photo = photos.wes;
