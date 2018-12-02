<link rel="stylesheet" class="aplayer-secondary-style-marker" href="/assets/css/APlayer.min.css"><script src="/assets/js/APlayer.min.js" class="aplayer-secondary-script-marker"></script>const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: true,
    mini: true,
    theme: '#FADFA3',
    loop: 'all',
    order: 'random',
    preload: 'auto',
    listFolded: false,
    listMaxHeight: 90,
    audio: [
        {
            name: "Love Yourself (Piano Version)",
            artist: '五光君',
            url: 'http://music.163.com/song/media/outer/url?id=551294967.mp3',
            cover: 'http://oeff2vktt.bkt.clouddn.com/image/84.jpg',
        },
        {
            name: 'Closer',
            artist: '五光君',
            url: 'http://music.163.com/song/media/outer/url?id=470844148.mp3',
            cover: 'http://p2.music.126.net/scSvjKsvzdwNsLKyzwFC_A==/109951162875291207.jpg',
        },
        {
            name: 'something just like this',
            artist: '五光君',
            url: 'http://music.163.com/song/media/outer/url?id=465064394.mp3',
            cover: 'http://p2.music.126.net/scSvjKsvzdwNsLKyzwFC_A==/109951162875291207.jpg',
        }
    ]
});
