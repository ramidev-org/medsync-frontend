import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function BaseIcon({ size = 22, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

export function IonCalendarOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <rect
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
        x="48"
        y="80"
        width="416"
        height="384"
        rx="48"
      />
      <circle cx="296" cy="232" r="24" fill="currentColor" />
      <circle cx="376" cy="232" r="24" fill="currentColor" />
      <circle cx="296" cy="312" r="24" fill="currentColor" />
      <circle cx="376" cy="312" r="24" fill="currentColor" />
      <circle cx="136" cy="312" r="24" fill="currentColor" />
      <circle cx="216" cy="312" r="24" fill="currentColor" />
      <circle cx="136" cy="392" r="24" fill="currentColor" />
      <circle cx="216" cy="392" r="24" fill="currentColor" />
      <circle cx="296" cy="392" r="24" fill="currentColor" />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
        strokeLinecap="round"
        x1="128"
        y1="48"
        x2="128"
        y2="80"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
        strokeLinecap="round"
        x1="384"
        y1="48"
        x2="384"
        y2="80"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
        x1="464"
        y1="160"
        x2="48"
        y2="160"
      />
    </BaseIcon>
  );
}

export function IonFolderOpenOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M64,192V120a40,40,0,0,1,40-40h75.89a40,40,0,0,1,22.19,6.72l27.84,18.56A40,40,0,0,0,252.11,112H408a40,40,0,0,1,40,40v40"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M479.9,226.55,463.68,392a40,40,0,0,1-39.93,40H88.25a40,40,0,0,1-39.93-40L32.1,226.55A32,32,0,0,1,64,192h384.1A32,32,0,0,1,479.9,226.55Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonCardOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <rect
        x="48"
        y="96"
        width="416"
        height="320"
        rx="56"
        ry="56"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="48"
        y1="192"
        x2="464"
        y2="192"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="60"
      />
      <rect
        x="128"
        y="300"
        width="48"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="60"
      />
    </BaseIcon>
  );
}

export function IonDocumentTextOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M416,221.25V416a48,48,0,0,1-48,48H144a48,48,0,0,1-48-48V96a48,48,0,0,1,48-48h98.75a32,32,0,0,1,22.62,9.37L406.63,198.63A32,32,0,0,1,416,221.25Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M256,56V176a32,32,0,0,0,32,32H408"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="176"
        y1="288"
        x2="336"
        y2="288"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="176"
        y1="368"
        x2="336"
        y2="368"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonMedkitOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <rect
        x="32"
        y="112"
        width="448"
        height="352"
        rx="48"
        ry="48"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M144,112V80a32,32,0,0,1,32-32H336a32,32,0,0,1,32,32v32"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="256"
        y1="208"
        x2="256"
        y2="368"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="336"
        y1="288"
        x2="176"
        y2="288"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonImagesOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M432,112V96a48.14,48.14,0,0,0-48-48H64A48.14,48.14,0,0,0,16,96V352a48.14,48.14,0,0,0,48,48H80"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <rect
        x="96"
        y="128"
        width="400"
        height="336"
        rx="45.99"
        ry="45.99"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <ellipse
        cx="372.92"
        cy="219.64"
        rx="30.77"
        ry="30.55"
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <path
        d="M342.15,372.17,255,285.78a30.93,30.93,0,0,0-42.18-1.21L96,387.64"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M265.23,464,383.82,346.27a31,31,0,0,1,41.46-1.87L496,402.91"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonHeartOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M352.92,80C288,80,256,144,256,144s-32-64-96.92-64C106.32,80,64.54,124.14,64,176.81c-1.1,109.33,86.73,187.08,183,252.42a16,16,0,0,0,18,0c96.26-65.34,184.09-143.09,183-252.42C447.46,124.14,405.68,80,352.92,80Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonFemaleOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <circle
        cx="256"
        cy="184"
        r="152"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="256"
        y1="336"
        x2="256"
        y2="480"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="314"
        y1="416"
        x2="198"
        y2="416"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonShieldCheckmarkOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <polyline
        points="336 176 225.2 304 176 255.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M463.1,112.37C373.68,96.33,336.71,84.45,256,48,175.29,84.45,138.32,96.33,48.9,112.37,32.7,369.13,240.58,457.79,256,464,271.42,457.79,479.3,369.13,463.1,112.37Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonArchiveOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M80,152V408a40.12,40.12,0,0,0,40,40H392a40.12,40.12,0,0,0,40-40V152"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <rect
        x="48"
        y="64"
        width="416"
        height="80"
        rx="28"
        ry="28"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <polyline
        points="320 304 256 368 192 304"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <line
        x1="256"
        y1="345.89"
        x2="256"
        y2="224"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonDocumentLockOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M288,304V286c0-16.63-14.26-30-32-30s-32,13.37-32,30v18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path d="M304,416H208a32,32,0,0,1-32-32V336a32,32,0,0,1,32-32h96a32,32,0,0,1,32,32v48A32,32,0,0,1,304,416Z" />
      <path
        d="M416,221.25V416a48,48,0,0,1-48,48H144a48,48,0,0,1-48-48V96a48,48,0,0,1,48-48h98.75a32,32,0,0,1,22.62,9.37L406.63,198.63A32,32,0,0,1,416,221.25Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M256,50.88V176a32,32,0,0,0,32,32H413.12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonPersonOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M344,144c-3.92,52.87-44,96-88,96s-84.15-43.12-88-96c-4-55,35-96,88-96S348,90,344,144Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M256,304c-87,0-175.3,48-191.64,138.6C62.39,453.52,68.57,464,80,464H432c11.44,0,17.62-10.48,15.65-21.4C431.3,352,343,304,256,304Z"
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonBusinessOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <line
        x1="176"
        y1="416"
        x2="176"
        y2="480"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M80,32H272a32,32,0,0,1,32,32V476a4,4,0,0,1-4,4H48a0,0,0,0,1,0,0V64A32,32,0,0,1,80,32Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M320,192H432a32,32,0,0,1,32,32V480a0,0,0,0,1,0,0H304a0,0,0,0,1,0,0V208A16,16,0,0,1,320,192Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path d="M98.08,431.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,98.08,431.87Z" />
      <path d="M98.08,351.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,98.08,351.87Z" />
      <path d="M98.08,271.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,98.08,271.87Z" />
      <path d="M98.08,191.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,98.08,191.87Z" />
      <path d="M98.08,111.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,98.08,111.87Z" />
      <path d="M178.08,351.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,178.08,351.87Z" />
      <path d="M178.08,271.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,178.08,271.87Z" />
      <path d="M178.08,191.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,178.08,191.87Z" />
      <path d="M178.08,111.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,178.08,111.87Z" />
      <path d="M258.08,431.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,258.08,431.87Z" />
      <path d="M258.08,351.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,258.08,351.87Z" />
      <path d="M258.08,271.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,258.08,271.87Z" />
      <ellipse
        cx="256"
        cy="176"
        rx="15.95"
        ry="16.03"
        transform="translate(-49.47 232.56) rotate(-45)"
      />
      <path d="M258.08,111.87a16,16,0,1,1,13.79-13.79A16,16,0,0,1,258.08,111.87Z" />
      <path d="M400,400a16,16,0,1,0,16,16,16,16,0,0,0-16-16Z" />
      <path d="M400,320a16,16,0,1,0,16,16,16,16,0,0,0-16-16Z" />
      <path d="M400,240a16,16,0,1,0,16,16,16,16,0,0,0-16-16Z" />
      <path d="M336,400a16,16,0,1,0,16,16,16,16,0,0,0-16-16Z" />
      <path d="M336,320a16,16,0,1,0,16,16,16,16,0,0,0-16-16Z" />
      <path d="M336,240a16,16,0,1,0,16,16,16,16,0,0,0-16-16Z" />
    </BaseIcon>
  );
}

export function IonSparklesOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M259.92,262.91,216.4,149.77a9,9,0,0,0-16.8,0L156.08,262.91a9,9,0,0,1-5.17,5.17L37.77,311.6a9,9,0,0,0,0,16.8l113.14,43.52a9,9,0,0,1,5.17,5.17L199.6,490.23a9,9,0,0,0,16.8,0l43.52-113.14a9,9,0,0,1,5.17-5.17L378.23,328.4a9,9,0,0,0,0-16.8L265.09,268.08A9,9,0,0,1,259.92,262.91Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <polygon
        points="108 68 88 16 68 68 16 88 68 108 88 160 108 108 160 88 108 68"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <polygon
        points="426.67 117.33 400 48 373.33 117.33 304 144 373.33 170.67 400 240 426.67 170.67 496 144 426.67 117.33"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonKeyOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M218.1,167.17c0,13,0,25.6,4.1,37.4-43.1,50.6-156.9,184.3-167.5,194.5a20.17,20.17,0,0,0-6.7,15c0,8.5,5.2,16.7,9.6,21.3,6.6,6.9,34.8,33,40,28,15.4-15,18.5-19,24.8-25.2,9.5-9.3-1-28.3,2.3-36s6.8-9.2,12.5-10.4,15.8,2.9,23.7,3c8.3.1,12.8-3.4,19-9.2,5-4.6,8.6-8.9,8.7-15.6.2-9-12.8-20.9-3.1-30.4s23.7,6.2,34,5,22.8-15.5,24.1-21.6-11.7-21.8-9.7-30.7c.7-3,6.8-10,11.4-11s25,6.9,29.6,5.9c5.6-1.2,12.1-7.1,17.4-10.4,15.5,6.7,29.6,9.4,47.7,9.4,68.5,0,124-53.4,124-119.2S408.5,48,340,48,218.1,101.37,218.1,167.17ZM400,144a32,32,0,1,1-32-32A32,32,0,0,1,400,144Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}

export function IonCheckmarkCircle(props: Props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M256,48C141.31,48,48,141.31,48,256s93.31,208,208,208,208-93.31,208-208S370.69,48,256,48ZM364.25,186.29l-134.4,160a16,16,0,0,1-12,5.71h-.27a16,16,0,0,1-11.89-5.3l-57.6-64a16,16,0,1,1,23.78-21.4l45.29,50.32L339.75,165.71a16,16,0,0,1,24.5,20.58Z"
        fill="currentColor"
      />
    </BaseIcon>
  );
}

export function IonArrowBack(props: Props) {
  return (
    <BaseIcon {...props}>
      <polyline
        points="244 400 100 256 244 112"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="48"
      />
      <line
        x1="120"
        y1="256"
        x2="412"
        y2="256"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="48"
      />
    </BaseIcon>
  );
}

export function IonArrowForward(props: Props) {
  return (
    <BaseIcon {...props}>
      <polyline
        points="268 112 412 256 268 400"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="48"
      />
      <line
        x1="392"
        y1="256"
        x2="100"
        y2="256"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="48"
      />
    </BaseIcon>
  );
}

export function IonImageOutline(props: Props) {
  return (
    <BaseIcon {...props}>
      <rect
        x="48"
        y="80"
        width="416"
        height="352"
        rx="48"
        ry="48"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <circle
        cx="336"
        cy="176"
        r="32"
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="32"
      />
      <path
        d="M304,335.79,213.34,245.3A32,32,0,0,0,169.47,244L48,352"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M224,432,347.34,308.66a32,32,0,0,1,43.11-2L464,368"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </BaseIcon>
  );
}
