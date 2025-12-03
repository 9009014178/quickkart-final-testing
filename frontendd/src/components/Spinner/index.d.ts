declare module "@/components/Spinner" {
  import { FC } from "react";

  interface SpinnerProps {
    size?: number;
    color?: string;
  }

  const Spinner: FC<SpinnerProps>;
  export default Spinner;
}
