const {registerFont, createCanvas} = require('canvas');

/**
 * Convert text to PNG image.
 * @param text
 * @param [options]
 * @param [options.font='30px sans-serif'] css style font
 * @param [options.color='black'] (or options.textColor) text color
 * @param [options.backgroundColor] (or options.bgColor) background color
 * @param [options.lineSpacing=0]
 * @param [options.padding=0] width of the padding area (left, top, right, bottom)
 * @param [options.paddingLeft]
 * @param [options.paddingTop]
 * @param [options.paddingRight]
 * @param [options.paddingBottom]
 * @param [options.borderWidth=0] width of border (left, top, right, bottom)
 * @param [options.borderLeftWidth=0]
 * @param [options.borderTopWidth=0]
 * @param [options.borderRightWidth=0]
 * @param [options.borderBottomWidth=0]
 * @param [options.borderColor='black'] border color
 * @param [options.textAlign='left'] text alignment (left, center, right)
 * @param [options.localFontPath] path to local font (e.g. fonts/Lobster-Regular.ttf)
 * @param [options.localFontName] name of local font (e.g. Lobster)
 * @param [options.output='buffer'] 'buffer', 'stream', 'dataURL', 'canvas's
 * @returns {string} png image buffer
 */
const text2png = (text, options) => {
  const canvas = createCanvas(0, 0);
  const ctx = canvas.getContext('2d');

  // Options
  options = parseOptions(options);

  // Register a custom font
  if (options.localFontPath && options.localFontName) {
    registerFont(options.localFontPath, { family: options.localFontName });
  }

  const max = {
    left: 0,
    right: 0,
    ascent: 0,
    descent: 0
  };

  let lastDescent;
  const lineProps = text.split('\n').map(line => {
    ctx.font = options.font;
    const metrics = ctx.measureText(line);

    const left = -1 * metrics.actualBoundingBoxLeft;
    const right = metrics.actualBoundingBoxRight;
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;

    max.left = Math.max(max.left, left);
    max.right = Math.max(max.right, right);
    max.ascent = Math.max(max.ascent, ascent);
    max.descent = Math.max(max.descent, descent);
    lastDescent = descent;

    return {line, left, ascent};
  });

  const lineHeight = max.ascent + max.descent + options.lineSpacing;

  canvas.width = max.left + max.right
    + options.borderLeftWidth + options.borderRightWidth
    + options.paddingLeft + options.paddingRight;

  canvas.height = lineHeight * lineProps.length
    + options.borderTopWidth + options.borderBottomWidth
    + options.paddingTop + options.paddingBottom
    - options.lineSpacing
    - (max.descent - lastDescent);

  const hasBorder = false
    || options.borderLeftWidth
    || options.borderTopWidth
    || options.borderRightWidth
    || options.borderBottomWidth;

  if (hasBorder) {
    ctx.fillStyle = options.borderColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(
      options.borderLeftWidth,
      options.borderTopWidth,
      canvas.width - (options.borderLeftWidth + options.borderRightWidth),
      canvas.height - (options.borderTopWidth + options.borderBottomWidth)
    );
  } else if (hasBorder) {
    ctx.clearRect(
      options.borderLeftWidth,
      options.borderTopWidth,
      canvas.width - (options.borderLeftWidth + options.borderRightWidth),
      canvas.height - (options.borderTopWidth + options.borderBottomWidth)
    );
  }

  ctx.font = options.font;
  ctx.fillStyle = options.textColor;
  ctx.antialias = 'gray';
  ctx.textAlign = options.textAlign;

  let offsetY = options.borderTopWidth + options.paddingTop;
  lineProps.forEach(lineProp => {
    // Calculate Y
    let x = 0;
    let y = max.ascent + offsetY;

    // Calculate X
    switch (options.textAlign) {
      case "start":
      case "left":
        x = lineProp.left + options.borderLeftWidth + options.paddingLeft;
        break;

      case "end":
      case "right":
        x = canvas.width - lineProp.left - options.borderRightWidth - options.paddingRight;
        break;

      case "center":
        x = canvas.width / 2;
        break;
    }

    ctx.fillText(lineProp.line, x, y);
    offsetY += lineHeight;
  });

  switch (options.output) {
    case 'buffer':
      return canvas.toBuffer();
    case 'stream':
      return canvas.createPNGStream();
    case 'dataURL':
      return canvas.toDataURL('image/png');
    case 'canvas':
      return canvas;
    default:
      throw new Error(`output type:${options.output} is not supported.`)
  }
};

function parseOptions(options) {
  return {
    backgroundColor     : options.bgColor || options.backgroundColor || null,
    borderBottomWidth   : options.borderBottomWidth || options.borderWidth || 0,
    borderColor         : options.borderColor || 'black',
    borderLeftWidth     : options.borderLeftWidth || options.borderWidth || 0,
    borderRightWidth    : options.borderRightWidth || options.borderWidth || 0,
    borderTopWidth      : options.borderTopWidth || options.borderWidth || 0,
    font                : options.font || '30px sans-serif',
    lineSpacing         : options.lineSpacing || 0,
    paddingLeft         : options.paddingLeft || options.padding || 0,
    paddingTop          : options.paddingTop || options.padding || 0,
    paddingRight        : options.paddingRight || options.padding || 0,
    paddingBottom       : options.paddingBottom || options.padding || 0,
    textAlign           : options.textAlign || 'left',
    textColor           : options.textColor || options.color || 'black',
    output              : options.output || 'buffer'
  };
}

module.exports = text2png;
