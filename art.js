const wrap = (content) => `<svg viewBox="0 0 300 180" aria-hidden="true">${content}</svg>`
export const art = {
  lamp: wrap(
    '<ellipse cx="154" cy="158" rx="52" ry="7" fill="#d9d6cb" opacity=".6"/><path d="M139 83h23l8 66h-39z" fill="#c6bba4"/><path d="M143 85h9l-1 65h-17z" fill="#d9cfba"/><ellipse cx="150" cy="150" rx="27" ry="5" fill="#b7ab91"/><path d="M79 88Q84 19 150 20Q215 19 222 88Z" fill="#c3ad86"/><path d="M79 88Q84 19 150 20Q114 32 114 88Z" fill="#d4c19b"/><ellipse cx="150" cy="88" rx="71" ry="9" fill="#b29b76"/><ellipse cx="150" cy="88" rx="64" ry="5" fill="#e0cda2"/><path d="M183 94v29" stroke="#887962" stroke-width="1"/><circle cx="183" cy="125" r="2" fill="#887962"/>'
  ),
  headphones: wrap(
    '<ellipse cx="150" cy="158" rx="64" ry="7" fill="#d2d8cd" opacity=".6"/><path d="M96 104V81Q95 27 150 27Q205 27 204 81v23" fill="none" stroke="#383c38" stroke-width="20"/><path d="M96 96V80Q96 28 150 28Q196 28 203 68" fill="none" stroke="#565b55" stroke-width="5"/><path d="M96 82v27m108-27v27" stroke="#898e83" stroke-width="5"/><rect x="78" y="87" width="39" height="65" rx="18" fill="#282f2a" transform="rotate(-9 97 119)"/><rect x="80" y="89" width="22" height="59" rx="11" fill="#424a41" transform="rotate(-9 97 119)"/><rect x="183" y="87" width="39" height="65" rx="18" fill="#252e28" transform="rotate(9 202 119)"/><rect x="200" y="90" width="18" height="58" rx="9" fill="#414a40" transform="rotate(9 202 119)"/>'
  ),
  cabinet: wrap(
    '<ellipse cx="149" cy="165" rx="56" ry="5" fill="#d9d0c4" opacity=".6"/><path d="M100 22h94v137h-94z" fill="#b9b09f"/><path d="m194 22 10 7v124l-10 6z" fill="#a69b89"/><path d="M105 28h39v123h-39zm44 0h39v123h-39z" fill="#d4cbb8"/><path d="M109 33h31v66h-31zm44 0h31v66h-31z" fill="#9a9c8b"/><path d="M109 33h31v66h-31zm44 0h31v66h-31z" fill="#d6dfcb" opacity=".3"/><path d="M109 54h31m-31 23h31m13-23h31m-31 23h31" stroke="#c5bca5" stroke-width="3"/><path d="M137 86v10m19-10v10" stroke="#655f52" stroke-width="2"/><path d="M108 159v6m79-6v6" stroke="#a69b89" stroke-width="4"/><path d="M116 72h16v4h-16zm41-23h19v4h-19z" fill="#d6cdb8"/><path d="m115 49 3-10h10l3 10z" fill="#c0b89d"/>'
  )
}
