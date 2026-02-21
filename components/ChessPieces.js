import React from "react";
import Svg, { G, Path, Circle, Ellipse, Line } from "react-native-svg";

const PieceSvg = ({ children, size = 45 }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45">
    {children}
  </Svg>
);

export function King({ size }) {
  return (
    <PieceSvg size={size}>
      <G
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path strokeLinejoin="miter" d="M22.5 11.63V6M20 8h5" />
        <Path
          fill="#fff"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
        />
        <Path
          fill="#fff"
          d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z"
        />
        <Path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
      </G>
    </PieceSvg>
  );
}

export function Queen({ size }) {
  return (
    <PieceSvg size={size}>
      <G
        fill="#fff"
        fillRule="evenodd"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm-12 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm24 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm4 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" />
        <Path
          d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15L14 11v14L7 14l2 12z"
          strokeLinecap="butt"
        />
        <Path
          d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
          strokeLinecap="butt"
        />
        <Path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" />
      </G>
    </PieceSvg>
  );
}

export function Rook({ size }) {
  return (
    <PieceSvg size={size}>
      <G
        fill="#fff"
        fillRule="evenodd"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path
          d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22V9h4v2h5V9h5v2h5V9h4v5"
          strokeLinecap="butt"
        />
        <Path d="M34 14l-3 3H14l-3-3" />
        <Path d="M15 17v7h15v-7" strokeLinecap="butt" strokeLinejoin="miter" />
        <Path d="M14 29.5v-13h17v13H14z" strokeLinecap="butt" strokeLinejoin="miter" />
        <Path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" strokeLinecap="butt" />
        <Path d="M12 35.5h21m-20-4h19m-18-2h17" fill="none" stroke="#000" />
      </G>
    </PieceSvg>
  );
}

export function Bishop({ size }) {
  return (
    <PieceSvg size={size}>
      <G
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <G fill="#fff" strokeLinecap="butt">
          <Path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" />
          <Path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <Path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
        </G>
        <Path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#000" strokeLinejoin="miter" />
      </G>
    </PieceSvg>
  );
}

export function Knight({ size }) {
  return (
    <PieceSvg size={size}>
      <G
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path
          fill="#fff"
          d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
        />
        <Path
          fill="#fff"
          d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
        />
        <Path fill="#000" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" />
        <Path
          fill="#000"
          d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z"
        />
      </G>
    </PieceSvg>
  );
}

export function Pawn({ size }) {
  return (
    <PieceSvg size={size}>
      <Path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#fff"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </PieceSvg>
  );
}

const PIECE_COMPONENTS = {
  K: King,
  Q: Queen,
  R: Rook,
  B: Bishop,
  N: Knight,
  P: Pawn,
};

export default function ChessPiece({ piece, size = 45 }) {
  const Component = PIECE_COMPONENTS[piece];
  if (!Component) return null;
  return <Component size={size} />;
}
