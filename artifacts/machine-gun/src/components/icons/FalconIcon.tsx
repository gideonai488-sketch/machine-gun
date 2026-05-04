export default function FalconIcon({ className = 'w-5 h-5', ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M32 4C28 4 22 8 18 16C14 24 13 28 14 32C15 36 18 38 18 38L12 48C12 48 10 52 14 54C18 56 22 52 22 52L26 46C26 46 28 48 32 48C36 48 38 46 38 46L42 52C42 52 46 56 50 54C54 52 52 48 52 48L46 38C46 38 49 36 50 32C51 28 50 24 46 16C42 8 36 4 32 4Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M32 8C29 8 25 11 22 17C19 23 18 27 19 30C20 33 22 34 22 34L28 22C28 22 30 18 32 18C34 18 36 22 36 22L42 34C42 34 44 33 45 30C46 27 45 23 42 17C39 11 35 8 32 8Z"
        fill="currentColor"
      />
      <circle cx="26" cy="24" r="2.5" fill="white" />
      <circle cx="38" cy="24" r="2.5" fill="white" />
      <circle cx="26" cy="24" r="1" fill="currentColor" />
      <circle cx="38" cy="24" r="1" fill="currentColor" />
      <path
        d="M29 30C29 30 30 32 32 32C34 32 35 30 35 30"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 20C4 20 10 18 14 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M60 20C60 20 54 18 50 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M6 26C6 26 11 25 15 26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M58 26C58 26 53 25 49 26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}
