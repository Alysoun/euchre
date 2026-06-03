import { css } from 'styled-components';

/** Shared look for card face images — frame comes from the SVG artwork. */
export const playingCardImgCss = css`
  border: none;
  outline: none;
  border-radius: 6px;
  background: #fff;
  display: block;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
`;

export const playingCardHighlightCss = css`
  box-shadow:
    0 0 16px rgba(255, 215, 0, 0.65),
    0 10px 22px rgba(0, 0, 0, 0.5);
`;
