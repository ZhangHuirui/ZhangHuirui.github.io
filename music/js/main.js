const ap1 = new APlayer({
    element: document.getElementById('aplayer'),
    fixed: true,   //开启吸底模式
    mini: true,    //开启迷你模式
    autoplay: false,//音频自动播放
    theme: '#b7daff',//主题色
    loop: 'all',   //音频循环播放, 可选值: 'all', 'one', 'none'
    order: 'list',  //音频循环顺序, 可选值: 'list', 'random'
    preload: 'metadata',//预加载，可选值: 'none', 'metadata', 'auto'
    volume: 0.7,// 默认音量，请注意播放器会记忆用户设置，用户手动设置音量后默认音量即失效
    lrcType: false,//
    mutex: true,//互斥，阻止多个播放器同时播放，当前播放器播放时暂停其他播放器
    customAudioType: '',//自定义类型
    listFolded: false,  //列表默认折叠
    //listMaxHeight:   - ,  //列表最大高度
    storageName: 'aplayer-setting',//  存储播放器设置的 localStorage key
    audio: [{
        name: 'Je Ne Serai Jamais Ta Parisienne',//名字
        artist: 'Nolwenn Leroy',//艺术家
        url: 'music/song/Nolwenn Leroy - Je Ne Serai Jamais Ta Parisienne.mp3',//音乐链接
        cover: 'music/img/Nolwenn Leroy - Je Ne Serai Jamais Ta Parisienne.jpg',//音乐封面
        lrc: "",//歌词
        theme: '#ebd0c2',//切换到此音频时的主题色，比上面的 theme 优先级高
        type: 'auto'//可选值: 'auto', 'hls', 'normal' 或其他自定义类型,
    }]
});
// ap1.on('play', function () {
//     console.log('play');
// });
// ap1.on('play', function () {
//     console.log('play play');
// });
// ap1.on('pause', function () {
//     console.log('pause');
// });
// ap1.on('canplay', function () {
//     console.log('canplay');
// });
// ap1.on('playing', function () {
//     console.log('playing');
// });
// ap1.on('ended', function () {
//     console.log('ended');
// });
// ap1.on('error', function () {
//     console.log('error');
// });
$.ajax({
    url: 'music/song-list.json',
    success: function (list) {
        ap1.list.add(list.songlist);
    }
});