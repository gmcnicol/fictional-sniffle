import { useEffect, useRef } from 'react';
import {
  motion,
  useAnimationControls,
  type HTMLMotionProps,
} from 'framer-motion';
import './IconButton.css';

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  pulse?: number;
}

export function IconButton({ children, pulse, ...props }: IconButtonProps) {
  const controls = useAnimationControls();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (pulse !== undefined) {
      controls.start({ rotate: [0, 360], scale: [1, 1.2, 1] });
    }
  }, [pulse, controls]);

  return (
    <motion.button
      className="icon-btn"
      animate={controls}
      transition={{ duration: 0.6 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
