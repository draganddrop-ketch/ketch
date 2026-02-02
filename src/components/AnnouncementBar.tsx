import { useSiteSettings } from '../context/SiteSettingsContext';

export const AnnouncementBar = () => {
  const { settings } = useSiteSettings();

  if (!settings?.announcement_text) return null;

  const height = settings.announcement_height || 40;
  const bgColor = settings.announcement_bg_color || '#09090b';
  const textColor = settings.announcement_text_color || '#a1a1aa';
  const speed = settings.announcement_speed || 20;
  const widthType = settings.announcement_width_type || 'FULL';

  const repeatedText = Array(20)
    .fill(settings.announcement_text)
    .join('\u00A0\u00A0\u00A0\u00A0\u00A0');

  const seamlessRibbon = repeatedText + '\u00A0\u00A0\u00A0\u00A0\u00A0' + repeatedText;

  return (
    <div
      className="border-b border-zinc-800 w-full"
      style={{
        height: `${height}px`,
        backgroundColor: bgColor,
      }}
    >
      <div
        className={`overflow-hidden whitespace-nowrap ${widthType === 'FIXED' ? 'max-w-[1300px] mx-auto' : 'w-full'}`}
        style={{
          height: `${height}px`,
        }}
      >
        <div
          className="inline-block text-xs font-mono"
          style={{
            animation: `marquee ${speed}s linear infinite`,
            color: textColor,
            lineHeight: `${height}px`,
          }}
        >
          {seamlessRibbon}
        </div>
      </div>
    </div>
  );
};
