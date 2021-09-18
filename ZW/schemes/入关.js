schemes['入关'] = {
    //三个学科 其中第一个是主学科 后两个是相关学科
    subj: ['入关学', '曹学', '嵩学'],
    //至少1个有关第一个学科的 字面上可以解释为物理结构的词
    stru: ['叶赫乎', 'bilibili'],
    //至少9个有关第一个学科的名人名言
    cele: [
        ['嵩子', '不入关死路一条'],
        ['嵩子', '我蛮夷也'],
        ['山高县', '犁庭扫穴已经迫在眉睫！'],
        ['山高县', '我们要靠自己的力量维护自由贸易'],
        ['山高县', '消灭北美奴隶主种族灭绝邪教信徒匪帮'],
        ['曹大佐', '不辩经'],
        ['曹大佐', '督工进去了吗'],
        ['曹大佐', '入关之后就有大豪斯和牛排'],
        ['曹大佐', '受迫害妄想症患者请出门右转美利坚'],
        ['曹大佐', '哪怕盖成化粪池，也不能再盖一栋房子'],
        ['曹大佐', '塔这东西也没有你们某些人幻想的那么敏感'],
    ],
    //至少3个有关第一个学科的思想（主义）
    prin: ['不辩经', '我蛮夷也', '犁庭扫穴', '大豪斯大牛排', '昭和'],
    //至少3个有关第一个学科的性质
    prop: ['去非洲', '吃肉肉', '反内卷'],
    //至少6个有关第一个学科的概念
    conc: ['碳水费拉不堪，牛排武德充沛', '不是我们要入关，是关要入我们', '粮食就是一切，一切为了粮食', '海量专家精确算，比你懂也比我懂', '肥皂论', '输出内卷'],
    init: function () {
        shuffle(this.stru);
        shuffle(this.cele);
        shuffle(this.prin);
        shuffle(this.prop);
        shuffle(this.conc);
    }
}