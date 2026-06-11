// =============================================
// EMOJI PICKER Component
// =============================================

const EmojiPicker = {
  visible: false,
  callback: null,

  categories: {
    '😀': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🤩','😘','😗','😚','😙','🥰','😏','😌','🤤','😜','😝','🤪','🤑','🤗','🤭','🤫','🤔','🤐','😐','😑','😶','😒','🙄','😬','😮','😯','😲','😳','🥺','😢','😭','😤','😠','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'],
    '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','❣️','💌','💤','💢','💣','💥','💫','💦','💨','🕳️','💬','💭','🗯️','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
    '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦂','🐢','🐍','🦎','🦖','🐙','🐠','🐟','🐬','🐳','🦈','🐊','🐅','🐆','🐘','🦏','🐪','🦘','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐈','🐓','🦃','🕊️','🐇','🐁','🐀','🐿️','🦔'],
    '🍔': ['🍔','🍕','🌮','🌯','🥗','🍝','🍜','🍲','🍱','🍣','🍤','🍙','🍚','🍛','🍳','🥘','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🌭','🍟','🥪','🥙','🧆','🌶️','🫑','🥒','🥬','🥦','🫘','🍅','🍆','🥑','🫛','🥝','🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍐','🍑','🍒','🍓','🫐','🍰','🎂','🧁','🍩','🍪','🍫','🍬','🍭','🍮','🍯','☕','🍵','🧃','🥤','🧋','🍺','🍻','🥂','🍷'],
    '⚽': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥊','🥋','🎯','⛳','🥅','🎣','🏊','🏄','🏇','🚴','🏋️','🤸','⛷️','🏂','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','🎯','🎳','🎮','🕹️','🎰'],
    '🌍': ['🌍','🌎','🌏','🌐','🗺️','🗾','🧭','🏔️','⛰️','🌋','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🕍','⛩️','🕋','🌃','🌄','🌅','🌆','🌇','🌉','🎆','🎇','🎑','🗿','🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','✈️','🚀','🛸','🚁','⛵','🚤','🛥️','🛳️','🚂','🚆'],
    '💡': ['💡','🔦','🕯️','🪔','🔥','💧','🌊','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌪️','❄️','☃️','⛄','💨','🌬️','🌫️','🌀','⭐','🌟','✨','💫','🎉','🎊','🎈','🎁','🎀','🎄','🎆','🎇','🧨','🪄','🔮','🧿','🎎','🎏','🎐','🪩','🏮','🔔','🔕','📣','📢','💰','💴','💵','💶','💷','💸','💳','💎','⚙️','🔧','🔨','⚒️','🛠️','⛏️','🔩','🔗','📎','📏','📐','✂️','📌','📍','🔑','🗝️','🔒','🔓','🔏']
  },

  toggle(callback) {
    if (this.visible) {
      this.hide();
    } else {
      this.show(callback);
    }
  },

  show(callback) {
    this.callback = callback;
    this.visible = true;

    const existing = document.querySelector('.emoji-picker-popup');
    if (existing) existing.remove();

    const cats = Object.keys(this.categories);
    const picker = document.createElement('div');
    picker.className = 'emoji-picker-popup';
    picker.innerHTML = `
      <div class="emoji-picker-header">
        ${cats.map((cat, i) => `<button class="${i === 0 ? 'active' : ''}" data-cat="${i}">${cat}</button>`).join('')}
      </div>
      <div class="emoji-grid" id="emojiGrid">
        ${this.renderCategory(0)}
      </div>
    `;

    document.body.appendChild(picker);

    // Category click handlers
    picker.querySelectorAll('.emoji-picker-header button').forEach(btn => {
      btn.addEventListener('click', () => {
        picker.querySelectorAll('.emoji-picker-header button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const grid = picker.querySelector('.emoji-grid');
        grid.innerHTML = this.renderCategory(parseInt(btn.dataset.cat));
        this.bindEmojiClicks(grid);
      });
    });

    this.bindEmojiClicks(picker.querySelector('.emoji-grid'));

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', this._outsideHandler = (e) => {
        if (!picker.contains(e.target) && !e.target.closest('.emoji-trigger')) {
          this.hide();
        }
      });
    }, 100);
  },

  renderCategory(catIndex) {
    const cats = Object.values(this.categories);
    const emojis = cats[catIndex] || cats[0];
    return emojis.map(e => `<button data-emoji="${e}">${e}</button>`).join('');
  },

  bindEmojiClicks(grid) {
    grid.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.callback) {
          this.callback(btn.dataset.emoji);
        }
        this.hide();
      });
    });
  },

  hide() {
    this.visible = false;
    const picker = document.querySelector('.emoji-picker-popup');
    if (picker) picker.remove();
    document.removeEventListener('click', this._outsideHandler);
  }
};
