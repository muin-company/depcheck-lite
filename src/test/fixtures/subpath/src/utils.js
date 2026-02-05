import map from 'lodash/map';

export const transform = (arr) => map(arr, x => x * 2);
