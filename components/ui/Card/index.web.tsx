import { Card as AntCard, type CardProps } from 'antd';

export type { CardProps };

export default function Card({ styles, ...props }: CardProps) {
  return (
    <AntCard
      styles={{ body: { padding: 16 }, ...styles }}
      {...props}
    />
  );
}
