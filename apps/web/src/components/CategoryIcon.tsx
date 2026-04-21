import React from 'react';
import type { LucideProps } from 'lucide-react';
import {
  ShoppingCart, Truck, DollarSign, Briefcase, Users, Building2,
  Megaphone, Landmark, Receipt, HelpCircle, TrendingUp, ArrowLeftRight,
} from 'lucide-react';
import { CATEGORY_ICON_COLORS } from '@/theme/financial';

type LucideIcon = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

const iconMap: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'truck': Truck,
  'dollar-sign': DollarSign,
  'briefcase': Briefcase,
  'users': Users,
  'building': Building2,
  'megaphone': Megaphone,
  'landmark': Landmark,
  'receipt': Receipt,
  'trending-up': TrendingUp,
  'arrow-left-right': ArrowLeftRight,
  'default': HelpCircle,
};

interface CategoryIconProps {
  icon?: string | null;
  colorIndex?: number;
  color?: string;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  colorIndex = 0,
  color,
  size = 32,
}) => {
  const bgColor = color ?? CATEGORY_ICON_COLORS[colorIndex % CATEGORY_ICON_COLORS.length] ?? '#B8B8B8';
  const IconComp = iconMap[icon ?? 'default'] ?? HelpCircle;
  const iconSize = Math.round(size * 0.5);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: `${bgColor}1A`,
        flexShrink: 0,
      }}
    >
      <IconComp size={iconSize} />
    </span>
  );
};

export default CategoryIcon;
