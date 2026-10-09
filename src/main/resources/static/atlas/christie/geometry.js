export const rooms=[
  {
    "id": "hall",
    "name": "入口大厅",
    "floor": 0,
    "x": 0,
    "z": 4,
    "w": 5,
    "d": 3,
    "chapter": 1,
    "type": "hall",
    "evidence": "第2章：由岩石台阶到平台，再由敞开的房门进入宽敞大厅。",
    "inference": "大厅与主楼梯的距离、形状为推定。",
    "center": [
      2.5,
      5.5
    ],
    "polygon": [
      [
        0,
        4
      ],
      [
        5,
        4
      ],
      [
        5,
        7
      ],
      [
        0,
        7
      ]
    ]
  },
  {
    "id": "living",
    "name": "休息厅",
    "floor": 0,
    "x": 0,
    "z": 0,
    "w": 5,
    "d": 4,
    "chapter": 1,
    "type": "living",
    "evidence": "第3章：有壁炉；壁炉旁有门通往邻室。",
    "inference": "休息厅在这一侧、尺寸与家具摆放为推定。",
    "center": [
      2.5,
      2
    ],
    "polygon": [
      [
        0,
        0
      ],
      [
        5,
        0
      ],
      [
        5,
        4
      ],
      [
        0,
        4
      ]
    ]
  },
  {
    "id": "dining",
    "name": "餐厅",
    "floor": 0,
    "x": 5.3,
    "z": 0,
    "w": 4.5,
    "d": 4,
    "chapter": 1,
    "type": "dining",
    "evidence": "第3章：晚餐在此举行，餐桌上有十个小瓷人。",
    "inference": "餐厅与休息厅的相对方位、门的位置没有完整交代。",
    "center": [
      7.55,
      2
    ],
    "polygon": [
      [
        5.3,
        0
      ],
      [
        9.8,
        0
      ],
      [
        9.8,
        4
      ],
      [
        5.3,
        4
      ]
    ]
  },
  {
    "id": "neighbor",
    "name": "邻室",
    "floor": 0,
    "x": -3,
    "z": 0,
    "w": 2.7,
    "d": 4,
    "chapter": 1,
    "type": "neighbor",
    "evidence": "第3章：与休息厅相邻，有门相通；桌上的留声机靠共墙放置。",
    "inference": "邻室用途、面积以及墙孔的具体高度未定。",
    "center": [
      -1.65,
      2
    ],
    "polygon": [
      [
        -3,
        0
      ],
      [
        -0.2999999999999998,
        0
      ],
      [
        -0.2999999999999998,
        4
      ],
      [
        -3,
        4
      ]
    ]
  },
  {
    "id": "kitchen",
    "name": "厨房",
    "floor": 0,
    "x": 5.3,
    "z": 4,
    "w": 4.5,
    "d": 3,
    "chapter": 1,
    "type": "kitchen",
    "evidence": "第8章等：厨房承担日常服务，原文另提小厨房。",
    "inference": "厨房、备餐区和储藏空间的分隔与通道未定。",
    "center": [
      7.55,
      5.5
    ],
    "polygon": [
      [
        5.3,
        4
      ],
      [
        9.8,
        4
      ],
      [
        9.8,
        7
      ],
      [
        5.3,
        7
      ]
    ]
  },
  {
    "id": "stairs",
    "name": "主楼梯",
    "floor": 0,
    "x": 5.3,
    "z": 7.3,
    "w": 2,
    "d": 3,
    "chapter": 1,
    "type": "stairs",
    "evidence": "第2章：女管家带维拉上楼。后文有沿走廊返回楼梯的描述。",
    "inference": "楼梯形式、踏步数与此处的位置为推定。",
    "center": [
      6.3,
      8.8
    ],
    "polygon": [
      [
        5.3,
        7.3
      ],
      [
        7.3,
        7.3
      ],
      [
        7.3,
        10.3
      ],
      [
        5.3,
        10.3
      ]
    ]
  },
  {
    "id": "corridor",
    "name": "客房走廊",
    "floor": 1,
    "x": 0,
    "z": 4,
    "w": 9.8,
    "d": 2,
    "chapter": 1,
    "type": "corridor",
    "evidence": "第2章：维拉的卧室在甬道尽头。",
    "inference": "走廊长度、折向以及其余房间的排列未定。",
    "center": [
      4.9,
      5
    ],
    "polygon": [
      [
        0,
        4
      ],
      [
        9.8,
        4
      ],
      [
        9.8,
        6
      ],
      [
        0,
        6
      ]
    ]
  },
  {
    "id": "vera",
    "name": "维拉的卧室",
    "floor": 1,
    "x": 0,
    "z": 0,
    "w": 4,
    "d": 4,
    "chapter": 1,
    "type": "vera",
    "evidence": "第2章：走廊尽头的卧室；一扇大窗面海，另一扇向东，有相连浴室。",
    "inference": "这里只固定卧室与浴室相连；房间轴向与窗口坐标为示意。",
    "center": [
      2,
      2
    ],
    "polygon": [
      [
        0,
        0
      ],
      [
        4,
        0
      ],
      [
        4,
        4
      ],
      [
        0,
        4
      ]
    ]
  },
  {
    "id": "bath",
    "name": "维拉的浴室",
    "floor": 1,
    "x": -2.7,
    "z": 0,
    "w": 2.5,
    "d": 4,
    "chapter": 1,
    "type": "bath",
    "evidence": "第2章：卧室另一边有铺浅蓝色瓷砖的浴室，门敞开。",
    "inference": "浴缸、洗手台与门位为展示补全。",
    "center": [
      -1.4500000000000002,
      2
    ],
    "polygon": [
      [
        -2.7,
        0
      ],
      [
        -0.20000000000000018,
        0
      ],
      [
        -0.20000000000000018,
        4
      ],
      [
        -2.7,
        4
      ]
    ]
  },
  {
    "id": "guests",
    "name": "其他客房 · 未定",
    "floor": 1,
    "x": 4.3,
    "z": 0,
    "w": 5.5,
    "d": 4,
    "chapter": 1,
    "type": "unknown",
    "evidence": "第2章：每位来客分配房间。后文反复描写各自卧室。",
    "inference": "不把缺少依据的房间顺序画成确定隔间。",
    "center": [
      7.05,
      2
    ],
    "polygon": [
      [
        4.3,
        0
      ],
      [
        9.8,
        0
      ],
      [
        9.8,
        4
      ],
      [
        4.3,
        4
      ]
    ]
  },
  {
    "id": "staff",
    "name": "佣人房",
    "floor": 2,
    "x": 1,
    "z": 0,
    "w": 5,
    "d": 4,
    "chapter": 1,
    "type": "staff",
    "evidence": "第8章：客房楼道另有小楼梯，上行至佣人房附近的小楼道。",
    "inference": "上层房间数量、层高和轮廓未定；此图只表达上行关系。",
    "center": [
      3.5,
      2
    ],
    "polygon": [
      [
        1,
        0
      ],
      [
        6,
        0
      ],
      [
        6,
        4
      ],
      [
        1,
        4
      ]
    ]
  },
  {
    "id": "shore",
    "name": "海边岩石",
    "x": -8,
    "z": 12,
    "w": 6,
    "d": 5,
    "floor": 3,
    "chapter": 1,
    "type": "yard",
    "evidence": "正文相关案件场景；岛上相对落点为示意。",
    "inference": "不是可用来测距的岛屿地图。",
    "center": [
      -5,
      14.5
    ],
    "polygon": [
      [
        -8,
        12
      ],
      [
        -2,
        12
      ],
      [
        -2,
        17
      ],
      [
        -8,
        17
      ]
    ]
  },
  {
    "id": "cliff",
    "name": "屋后悬崖",
    "x": 0,
    "z": 12,
    "w": 6,
    "d": 5,
    "floor": 3,
    "chapter": 1,
    "type": "yard",
    "evidence": "正文相关案件场景；岛上相对落点为示意。",
    "inference": "不是可用来测距的岛屿地图。",
    "center": [
      3,
      14.5
    ],
    "polygon": [
      [
        0,
        12
      ],
      [
        6,
        12
      ],
      [
        6,
        17
      ],
      [
        0,
        17
      ]
    ]
  },
  {
    "id": "stepsEast",
    "name": "别墅东侧石阶",
    "x": 8,
    "z": 12,
    "w": 4,
    "d": 5,
    "floor": 3,
    "chapter": 1,
    "type": "yard",
    "evidence": "正文相关案件场景；岛上相对落点为示意。",
    "inference": "不是可用来测距的岛屿地图。",
    "center": [
      10,
      14.5
    ],
    "polygon": [
      [
        8,
        12
      ],
      [
        12,
        12
      ],
      [
        12,
        17
      ],
      [
        8,
        17
      ]
    ]
  },
  {
    "id": "laundry",
    "name": "洗衣房 / 劈柴处",
    "x": 14,
    "z": 12,
    "w": 4,
    "d": 5,
    "floor": 3,
    "chapter": 1,
    "type": "laundry",
    "evidence": "正文相关案件场景；岛上相对落点为示意。",
    "inference": "不是可用来测距的岛屿地图。",
    "center": [
      16,
      14.5
    ],
    "polygon": [
      [
        14,
        12
      ],
      [
        18,
        12
      ],
      [
        18,
        17
      ],
      [
        14,
        17
      ]
    ]
  },
  {
    "id": "landing",
    "name": "码头与上岸台阶",
    "x": -8,
    "z": 20,
    "w": 6,
    "d": 4,
    "floor": 3,
    "chapter": 1,
    "type": "yard",
    "evidence": "正文相关案件场景；岛上相对落点为示意。",
    "inference": "不是可用来测距的岛屿地图。",
    "center": [
      -5,
      22
    ],
    "polygon": [
      [
        -8,
        20
      ],
      [
        -2,
        20
      ],
      [
        -2,
        24
      ],
      [
        -8,
        24
      ]
    ]
  },
  {
    "id": "summit",
    "name": "岛顶与露台外景",
    "x": 0,
    "z": 20,
    "w": 6,
    "d": 4,
    "floor": 3,
    "chapter": 1,
    "type": "yard",
    "evidence": "正文相关案件场景；岛上相对落点为示意。",
    "inference": "不是可用来测距的岛屿地图。",
    "center": [
      3,
      22
    ],
    "polygon": [
      [
        0,
        20
      ],
      [
        6,
        20
      ],
      [
        6,
        24
      ],
      [
        0,
        24
      ]
    ]
  }
];
export const personNames=["维拉","隆巴德","沃格雷夫","阿姆斯特朗","布洛尔","布伦特","麦克阿瑟","马斯顿","罗杰斯","罗杰斯太太"],roles=["秘书","冒险家","法官","医生","前警探","女士","将军","青年","管家","女管家"],colors=["#c9a384","#709d99","#a59cc0","#80adb9","#798c9d","#b98b9b","#87917b","#c7ac70","#9b8f7b","#8f839e"],floorNames={0:'一层公共空间',1:'二层客房',2:'上层佣人房',3:'岛上外景'};
export const initialRooms=rooms.map(r=>r.id);export const byId=id=>rooms.find(r=>r.id===id);export function constrain(r,x,z){return {x:Math.max(r.x+.15,Math.min(r.x+r.w-.15,x)),z:Math.max(r.z+.15,Math.min(r.z+r.d-.15,z))};}
