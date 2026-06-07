import React from 'react';
import { 
  Pencil, 
  Palette, 
  ArrowRight, 
  Grid3X3, 
  Sparkles, 
  Trash2, 
  Download, 
  Undo2, 
  Redo2, 
  Search, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Eraser, 
  Pipette, 
  PaintBucket, 
  ArrowLeftRight,
  Clock,
  Settings as SettingsIcon
} from 'lucide-react';
import { Language, Theme } from '../types';

interface TutorialViewProps {
  lang: Language;
  theme: Theme;
  onNavigateToCanvas: () => void;
}

export const TutorialView: React.FC<TutorialViewProps> = ({ lang, theme, onNavigateToCanvas }) => {
  const isZh = lang === 'zh';

  // Dynamic Styles
  const containerClass = theme === 'dark'
    ? 'text-slate-100'
    : theme === 'forest'
      ? 'text-[#13351e]'
      : 'text-slate-800';

  const cardClass = theme === 'dark'
    ? 'bg-slate-800/40 border-slate-700/60 text-slate-100 hover:bg-slate-800/60'
    : theme === 'forest'
      ? 'bg-[#f4faf5be] border-[#bcd9c4] text-[#13351e] hover:bg-[#e4eff1a0]'
      : 'bg-white/80 border-slate-200 text-slate-800 shadow-sm hover:shadow-md';

  const badgeClass = theme === 'dark'
    ? 'bg-slate-700 text-slate-300'
    : theme === 'forest'
      ? 'bg-[#ecf5ee] text-[#2c5738]'
      : 'bg-slate-100 text-slate-600';

  const iconBgClass = theme === 'dark'
    ? 'bg-slate-900/60 text-blue-400'
    : theme === 'forest'
      ? 'bg-[#ecf5ee] text-[#204a29]'
      : 'bg-slate-100 text-blue-600';

  const toolsList = [
    {
      id: 'undo',
      icon: <Undo2 size={18} className="text-blue-500" />,
      nameZh: '撤销',
      nameEn: 'Undo',
      descZh: '撤销上一步绘制。系统支持记录多达50步的高级历史记录，方便你随时回退与修改。',
      descEn: 'Revert your last paint action. Supports up to 50 steps of detailed layer history.',
    },
    {
      id: 'redo',
      icon: <Redo2 size={18} className="text-blue-500" />,
      nameZh: '重做',
      nameEn: 'Redo',
      descZh: '恢复你刚才撤销的步骤，可用于撤销前后效果的快速比对。',
      descEn: 'Restore the last undone action to compare side-by-side design adjustments effortlessly.',
    },
    {
      id: 'clear',
      icon: <Trash2 size={18} className="text-red-500" />,
      nameZh: '清空画布',
      nameEn: 'Clear Canvas',
      descZh: '一键清除网格上的所有颜色和块面，还原为干净的背景。默认默认会弹窗进行二次确认以防误触。',
      descEn: 'Clear all colors and blocks back to a clean background with a single tap. Prompts a confirmation dialog to help prevent accidental wipes.',
    },
    {
      id: 'download',
      icon: <Download size={18} className="text-indigo-500" />,
      nameZh: '保存图片 / 下载图纸',
      nameEn: 'Save Image / Download Blueprint',
      descZh: '一键将当前画布内容导出到本地，保存为超高分辨率、细节饱满的透明PNG格式图片，完美适配画布方块/拼豆风格。',
      descEn: 'Export current canvas content locally as a high-density, sharp transparent PNG, perfectly matched to square or bead grid patterns.',
    },
    {
      id: 'analyze',
      icon: <Search size={18} className="text-emerald-500" />,
      nameZh: '分析图纸',
      nameEn: 'Analyze Blueprint',
      descZh: '开启后将生成拼豆点阵一比一还原对照图纸，右侧以清晰列表统计每种十六进制颜色对应的辅料数量。',
      descEn: 'Generate a 1:1 alignment guide sheet with color numbers, accompanied by a precise count list summarizing required accessory quantities for each hex code on the right panel.',
    },
    {
      id: 'upload',
      icon: <ImageIcon size={18} className="text-purple-500" />,
      nameZh: '上传图片到网格',
      nameEn: 'Import Image to Grid',
      descZh: '支持选取外界常规照片，AI与点阵量化算法会智能将图片进行重排、尺寸缩减并无缝映射到格子里。',
      descEn: 'Upload external photos. Quantization and pixelation algorithms automatically rescale, downsample, and seamlessly map images into the grid cells.',
    },
    {
      id: 'palette',
      icon: <Palette size={18} className="text-pink-500" />,
      nameZh: '识别主要色彩',
      nameEn: 'Isolate Key Colors',
      descZh: '智能独创算法快速聚合并一键统计画布中所有使用的主要颜色，并默认勾选推荐少数几个最主要色，也可手动勾选，实现降色的目的。',
      descEn: 'Smart proprietary algorithms quickly group and count the main colors used in the canvas. It auto-selects a few recommended dominant tones while letting you manually toggle colors to achieve color-reduction goals easily.',
    },
    {
      id: 'size',
      icon: <Grid3X3 size={18} className="text-sky-500" />,
      nameZh: '画布尺寸 / 自定义',
      nameEn: 'Canvas Dimensions / Custom',
      descZh: '拉动滑块可以在10×10至200×200格之间随意无级缩放高清晰画布，或者直接输入特定数字快速重组像素矩阵。',
      descEn: 'Scale your high-resolution canvas seamlessly from 10×10 to 200×200 grids with a slider, or type numbers to restructure the pixel matrix instantly.',
    },
    {
      id: 'square',
      icon: <Square size={18} className="text-slate-500" />,
      nameZh: '方块风格',
      nameEn: 'Square Style',
      descZh: '将像素格式化展现为传统的实心几何方块切片，适合FC游戏怀旧风格、硬派极简点阵画制作。',
      descEn: 'Style your pixels as classic, solid geometric square chips, great for retro NES nostalgics and minimalist pixel creations.',
    },
    {
      id: 'bead',
      icon: <Circle size={18} className="text-slate-500" />,
      nameZh: '豆豆风格',
      nameEn: 'Bead Style',
      descZh: '把每个着色点以立体圆形拼豆（拼板豆豆）形式展现，并拥有实感内环，百分百精确还原线下物理豆玩具质感。',
      descEn: 'Render every coordinate as a physical-looking rounded bead with a realistic inner core, capturing physical hama/perler bead art perfectly.',
    },
    {
      id: 'gridLines',
      icon: <Grid3X3 size={18} className="text-slate-400" />,
      nameZh: '网格线开关',
      nameEn: 'Gridlines Toggle',
      descZh: '一件快速隐藏/显示每个微小网格单元的虚线边界，在绘图和查看纯净成品无暇渲染之间流畅穿梭。',
      descEn: 'Quickly hide/reveal the dashed outlines around each pixel cell to easily switch between detailed editing and viewing a clean finished layout.',
    },
    {
      id: 'pen',
      icon: <Pencil size={18} className="text-sky-500" />,
      nameZh: '画笔工具 (Pen)',
      nameEn: 'Pencil Tool',
      descZh: '经典的核心上色笔。在画布上点按或者长按横扫进行平滑着色，配合下方的「工具大小」滑块可以调节着力直径。',
      descEn: 'The core coloring pencil. Tap or drag across the grid for smooth drawing. Adjust the "Brush Size" slider below to change drawing radius.',
    },
    {
      id: 'eraser',
      icon: <Eraser size={18} className="text-sky-500" />,
      nameZh: '橡皮擦 (Eraser)',
      nameEn: 'Eraser Tool',
      descZh: '将目标格式恢复到未涂色的底纹背景（透明度状态），同样支持根据范围滑动自由调节笔刷尺寸大小。',
      descEn: 'Wipe off colors back to transparent blocks. Supports resizing via the brush size slider for wider erasure.',
    },
    {
      id: 'eyedropper',
      icon: <Pipette size={18} className="text-sky-500" />,
      nameZh: '吸管工具 (Pick)',
      nameEn: 'Eyedropper Tool',
      descZh: '点按画面已经绘制的色彩像素，一秒抽取极易混淆的精确色号（16进制值），秒变画笔当前激活色。',
      descEn: 'Pick any color directly from the canvas to load its exact hex code back into your brush instantly.',
    },
    {
      id: 'fill',
      icon: <PaintBucket size={18} className="text-sky-500" />,
      nameZh: '泼墨填充 (Paint Bucket)',
      nameEn: 'Flood Fill (Paint Bucket)',
      descZh: '油漆桶模式。点击一个颜色单元时，将会用当前画笔颜色批量填满周围所有相同颜色区域。',
      descEn: 'Paint bucket tool. Click a pixel to flood-fill contiguous target regions sharing the same color with your current brush color.',
    },
    {
      id: 'floodErase',
      icon: (
        <div className="relative w-5 h-5 flex items-center justify-center">
          <PaintBucket size={15} className="opacity-80 text-sky-500" />
          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded p-[1px] shadow-sm flex items-center justify-center border border-white dark:border-slate-800 scale-90">
            <Eraser size={7} strokeWidth={3} />
          </div>
        </div>
      ),
      nameZh: 'Flood Erase (区域清除)',
      nameEn: 'Flood Erase',
      descZh: '魔术擦功能。点击后能秒速清理画面上所有相近、相邻、颜色相同的像素连通区域，变作透明效果。',
      descEn: 'Magic erase. Erases interconnected pixel clusters sharing the same color back to transparent state simultaneously.',
    },
    {
      id: 'replace',
      icon: <ArrowLeftRight size={18} className="text-emerald-500" />,
      nameZh: '像素替换 (Replace)',
      nameEn: 'Color Replacement',
      descZh: '选定指定的“源颜色”（点1）与欲换得的“目标色”（点2），点击一键全局完成此色调的精确重绘升级。',
      descEn: 'Select a source target color on canvas and pick an alternative color to replace all instances globally in one click.',
    },
    {
      id: 'denoise',
      icon: <Sparkles size={18} className="text-amber-500 animate-pulse" />,
      nameZh: '智能消噪 (Denoise)',
      nameEn: 'Smart Denoise',
      descZh: '消除单像素孤立点和透明背景中孤立点，只保留主体区域。',
      descEn: 'Eliminate isolated single pixels and scattered background artifacts to preserve only cohesive main design shapes.',
    },
    {
      id: 'paletteSelect',
      icon: <Clock size={18} className="text-slate-500" />,
      nameZh: '最近使用',
      nameEn: 'Recent Colors',
      descZh: '纪录最近用过的颜色。',
      descEn: 'Tracks and displays recently utilized custom colors for swift access.',
    },
    {
      id: 'settings',
      icon: <SettingsIcon size={18} className="text-slate-500" />,
      nameZh: '选项与背景设置',
      nameEn: 'Settings & Background Themes',
      descZh: '包含「白天」、「黑夜」、「护眼森林」三种优雅主题，并附带关于作者的信息。',
      descEn: 'Switch between Day, Night, and eye-friendly Forest Green background themes, accompanied by author info.',
    }
  ];

  return (
    <div className={`w-full max-w-5xl mx-auto px-4 py-6 md:py-10 ${containerClass}`}>
      
      {/* Welcome Banner */}
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-blue-500/10 text-blue-500">
          <Sparkles size={14} className="animate-pulse" />
          {isZh ? '画板所有功能一览' : 'Complete Functional Directory'}
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-800 dark:text-slate-100">
          {isZh ? '💡 像素画笔与拼豆功能完全指南' : '💡 Pixel Art & Bead Studio Manual'}
        </h2>
        <p className="text-sm md:text-base opacity-80 leading-relaxed max-w-2xl mx-auto">
          {isZh 
            ? '本指南为您整理了画板面板上的每一个可以点击的功能与工具。请通过对应的图标进行对照、轻松上手所有的点阵转换与画绘工艺！' 
            : 'Interactive index detailing every single clickable function, icon, and utility in the workspace.'}
        </p>
      </div>

      {/* Grid of All Clickable Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {toolsList.map((toolItem) => (
          <div 
            key={toolItem.id} 
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 hover:translate-y-[-2px] ${cardClass}`}
          >
            {/* Styled Icon Badge Container */}
            <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${iconBgClass}`}>
              {toolItem.icon}
            </div>

            {/* Title & Functional Explanations */}
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-base tracking-tight mb-1.5 text-slate-800 dark:text-slate-100">
                {isZh ? toolItem.nameZh : toolItem.nameEn}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isZh ? toolItem.descZh : toolItem.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <button
          onClick={onNavigateToCanvas}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-sm"
        >
          {isZh ? '立即进入画板，开始设计！' : 'Start Designing on the Canvas Now!'}
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
};
