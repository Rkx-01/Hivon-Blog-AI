/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}
