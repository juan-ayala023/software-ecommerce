// Formato colombiano: punto de miles, sin decimales
export const miles = (n) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const cop = (n) => (n < 0 ? '-$' : '$') + miles(Math.abs(n))

export const pct = (n, d = 0) => `${(n * 100).toFixed(d).replace('.', ',')}%`

export const dec = (n, d = 2) => n.toFixed(d).replace('.', ',')
