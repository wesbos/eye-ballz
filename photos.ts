// this is just a list of generated items so I can reference them

export const photos = {
  wes: {
    filename: 'photos/wes-straight-on.jpg',
    PREFIX: 'wes-big',
    X_STEPS: 25,
    Y_STEPS: 25,
  },
  // norma: {
  //   filename: 'photos/norma.jpg',
  //   PREFIX: 'norma',
  //   X_STEPS: 10,
  //   Y_STEPS: 10,
  // },
  bert: {
    filename: 'photos/bert.jpg',
    PREFIX: 'bert',
    X_STEPS: 5,
    Y_STEPS: 5,
  },
  weshandsome: {
    filename: 'photos/wes-handsome.jpg',
    PREFIX: 'wes-handsome',
    X_STEPS: 1,
    Y_STEPS: 10,
  },
  arnold: {
    filename: 'photos/arnold.jpg',
    PREFIX: 'arnold',
    X_STEPS: 8,
    Y_STEPS: 1,
  },
  bean: {
    filename: 'photos/bean.webp',
    PREFIX: 'bean',
    X_STEPS: 3,
    Y_STEPS: 3,
  },
  snickers: {
    filename: 'photos/snickers.jpg',
    PREFIX: 'snickers',
    X_STEPS: 10,
    Y_STEPS: 10,
  },
  // scottwes: {
  //   filename: 'photos/scott-wes.png',
  //   PREFIX: 'scott-wes',
  //   X_STEPS: 10,
  //   Y_STEPS: 10,
  // }
}

export type Photo = typeof photos[keyof typeof photos];
