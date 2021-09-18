schemes['linguistics'] = {
    //三个学科 其中第一个是主学科 后两个是相关学科
    subj: ['语言学', '语音学', '语用学'],
    //至少1个有关第一个学科的 字面上可以解释为物理结构的词
    stru: ['工具格', '精密阶', '伊比利亚语支'],
    //至少9个有关第一个学科的名人名言
    cele: [
        ['妮娜·乔治', '经常地，不是我们塑造了我们使用的文字，而是我们使用的文字塑造了我们。'],
        ['弗朗茨·芬农', '说一门语言，就是去了解一个世界，一种文化。'],
        ['乔治·史坦纳', '当一门语言消失时，一种理解世界、观察世界的方式也随之消失。'],
        ['约瑟夫·布罗德斯基', '我们和其他生物相区别之处，首先在于语言，其次在于诗歌。而诗歌正是最极致的语言应用。'],
        ['罗伯特·海因莱因', '越长的单词越是简单而不容易用错，而且它们的含义很少改变。'],
        ['让·皮亚杰', '逻辑与数学什么都不是，就是特殊的语言结构。'],
        ['帕特·布坎南', '任何认为一个国家可以在没有民族内核或语言内核的情况下维系下去的人，都是无比天真的。'],
        ['罗伯特梅', '我研究威权主义很久了，40年了，而我发现它是由一群想控制意识形态和语言领域的人发动的。'],
        ['大卫·克里斯托', '每个社会群体都有它基于语言的联系机制。'],
    ],
    //至少3个有关第一个学科的思想（主义）
    prin: ['非对称二元', '音位心理', '感觉经验', '反主观'],
    //至少3个有关第一个学科的性质
    prop: ['同时', '继承', '任意', '融合'],
    //至少6个有关第一个学科的概念
    conc: ['塞擦音', '屈折语', '辅音交替', '汉藏语系', '语素变体', '逆构词法'],
    init: function (){
        shuffle(this.stru);
        shuffle(this.cele);
        shuffle(this.prin);
        shuffle(this.prop);
        shuffle(this.conc);
    }
}
