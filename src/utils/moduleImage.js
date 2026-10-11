import vectorBg from '../assets/images/modules/vector-bg.png';
import differentiation from '../assets/images/modules/differentiation.png';
import integrate from '../assets/images/modules/integrate.png';

// Maps a module to its cover photo by title keyword. Modules carry no
// image field, so matching stays in code. Returns null when nothing
// matches and the card renders a neutral theme block instead.
const COVERS = [
  { match: ['vector'], src: vectorBg },
  { match: ['differentiat', 'derivative', 'chain rule'], src: differentiation },
  { match: ['integrat', 'area under'], src: integrate },
];

export function getModuleCover(module) {
  if (module?.image_url) return module.image_url;
  if (module?.cover_url) return module.cover_url;
  const title = (module?.title ?? '').toLowerCase();
  for (const { match, src } of COVERS) {
    if (match.some((k) => title.includes(k))) return src;
  }
  return null;
}
