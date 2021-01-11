! function() {
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/npm/vue@2.5";
  script.onload = init;
  document.body.append(script);
}();

const BASE_URL = 'https://secret-savannah-58732.herokuapp.com';

async function init() {
  let prev, prevId, player;

  const vm = new Vue({
    el: '#app',
    data: {
      items: [],
    },
    methods: {
      search(q) {
        const requestURL = `${BASE_URL}/s?q=${encodeURI(q)}`;
        return fetch(requestURL).then(res => res.json());
      },
      video(id) {
        const requestURL = `${BASE_URL}/v/${id}`;
        return fetch(requestURL).then(res => res.json())
          .then(data => data.formats);
      },
      audio() {
        if (player) {
          player.pause();
          return player;
        }
        player = document.createElement('audio');
        player.controls = false;
        player.volume = 1;
        player.addEventListener('error', () => {
          prev.state = null;
          prev.playing = false;
          this.next();
        });
        player.addEventListener('ended', () => {
          prev.state = null;
          prev.playing = false;
          this.next();
        });
        player.addEventListener('canplaythrough', () => {
          prev.loading = false;
          player.play();
        });
        player.addEventListener('pause', () => {
          prev.state = 'paused';
        })
        player.addEventListener('play', () => {
          prev.state = 'played';
        });
        player.addEventListener('change', () => {
          prev.playing = true;
        });
        document.body.appendChild(player);
        return player;
      },
      load(index) {
        if (prevId == index) return;
        let now = this.items[index];
        if (prev) this.stop();
        prev = now;
        prevId = index;
        now.state = 'search';
        now.playing = true;
        now.loading = true;
        this.searchAndloadAudio(now.name, now.byArtist.name)
          .then((m) => {
            let el = document.querySelector(`#track-${index}`);
            m.play();
            el && el.scrollIntoView({
              behavior: 'smooth',
            });
          });
      },
      async searchAndloadAudio(name, artists) {
        let q = name;
        if (artists instanceof Array) {
          q += ' - ' + artists.join(',');
        }
        let t = document.querySelector('title');
        let s = await this.search(q);
        let m = this.audio();
        let v = await this.video(s[0].videoId);
        let r = v.filter(v => !!v.hasAudio && !v.hasVideo);
        r = r.sort((a, b) => b.bitrate - a.bitrate)
          .map(o => ({
            s: o.url,
            t: o.mimeType.split(';')[0],
          }));
        if (t) t.innerHTML = q;
        const p = r.filter(a => a.t.includes('mp4'));
        m.src = p.length ? p[0].s : r[0].s;
        m.type = p.length ? p[0].t : r[0].t;
        return m;
      },
      play() {
        player.play();
      },
      pause() {
        player.pause();
      },
      stop() {
        player.pause();
        prev.loading = prev.playing = false;
        prev.state = null;
      },
      next() {
        let id = prevId + 1;
        if (id >= this.items.length) return;
        return this.load(id);
      },
      prev() {
        let id = prevId - 1;
        if (id < 0) return;
        return this.load(id);
      },
    }
  });
  const url = './chart-74.json';
  const data = await (await fetch(url)).json();
  const track = data.track;
  const hits = track && track.itemListElement;
  vm.items = hits.map(hit => {
    let item = hit.item;
    item.position = hit.position;
    item.playing = false;
    item.loading = false;
    item.state = null;
    return item;
  });
}