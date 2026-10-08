export function SVGFilters() {
  return (
    <svg style={{ display: "none" }}>
      <defs>
        <filter id="ftRgbShift" x="0" y="0" colorInterpolationFilters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
          <feComponentTransfer in="SourceGraphic" result="_R">
            <feFuncR type="table" tableValues="0 1" />
            <feFuncG type="table" tableValues="0 0" />
            <feFuncB type="table" tableValues="0 0" />
          </feComponentTransfer>

          <feComponentTransfer in="SourceGraphic" result="G">
            <feFuncR type="table" tableValues="0 0" />
            <feFuncG type="table" tableValues="0 1" />
            <feFuncB type="table" tableValues="0 0" />
          </feComponentTransfer>

          <feComponentTransfer in="SourceGraphic" result="_B">
            <feFuncR type="table" tableValues="0 0" />
            <feFuncG type="table" tableValues="0 0" />
            <feFuncB type="table" tableValues="0 1" />
          </feComponentTransfer>

          <feOffset in="_R" dx={-3} dy={-3} result="R" />
          <feOffset in="_B" dx={3} dy={3} result="B" />

          <feBlend in="R" in2="G" mode="screen" result="RG" />
          <feBlend in="RG" in2="B" mode="screen" result="Finle" />
          <feComposite in="Finle" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id="ftVHS" x="0" y="0" colorInterpolationFilters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" >
          <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="BK_Data" />

          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="_CR_Blur" />

          <feOffset in="_CR_Blur" dx="-5" result="CR_Blur" />

          <feBlend in="CR_Blur" in2="BK_Data" mode="color" result="Finle" />

          <feComposite in="Finle" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id="noiseOverlay" colorInterpolationFilters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">

          <feTurbulence type="turbulence" baseFrequency="100 1" numOctaves="6" seed="1" stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence" />

          <feColorMatrix type="saturate" values="0" x="0%" y="0%" width="100%" height="100%" in="turbulence" result="colormatrix" />

          <feColorMatrix type="luminanceToAlpha" x="0%" y="0%" width="100%" height="100%" in="colormatrix" result="colormatrix3" />

          <feComponentTransfer x="0%" y="0%" width="100%" height="100%" in="colormatrix3" result="componentTransfer1">

            <feFuncR type="linear" slope="1" intercept="0" />
            <feFuncG type="linear" slope="1" intercept="0" />
            <feFuncB type="linear" slope="1" intercept="0" />
            <feFuncA type="linear" slope="0.5" intercept="0" />

          </feComponentTransfer>

          <feBlend mode="multiply" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" in2="componentTransfer1" result="blend1" />

        </filter>
      </defs>
    </svg>
  )
}
