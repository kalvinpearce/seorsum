import { getFromPath } from './path';

const obj = {
  one: {
    two: {
      three: {
        four: {
          five: {
            six: {
              seven: {
                eight: {
                  nine: {
                    ten: {
                      eleven: {
                        twelve: {
                          thirteen: {
                            fourteen: {
                              fifteen: {
                                sixteen: {
                                  seventeen: {
                                    eighteen: {
                                      nineteen: {
                                        twenty: {
                                          twentyOne: 'success',
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

describe('getFromPath', () => {
  it('can reach 10 deep', () => {
    const result = getFromPath(obj, [
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
    ]);

    expect(result).toBe(obj.one.two.three.four.five.six.seven.eight.nine.ten);
  });

  it('returns undefined if path is broken', () => {
    const result = getFromPath(obj, [
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
      'This should be undefined',
    ]);

    expect(result).toBe(undefined);
  });
});
