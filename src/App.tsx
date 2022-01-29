import React from "react";

const gauss = function (mu:number, sigma:number) {
    const a = 1 - Math.random();
    const b = 1 - Math.random();
    const c = Math.sqrt(-2 * Math.log(a));
    if(0.5 - Math.random() > 0) {
        return c * Math.sin(Math.PI * 2 * b) * sigma + mu;
    } else {
        return c * Math.cos(Math.PI * 2 * b) * sigma + mu;
    }
};

interface Props {
    age: number; // 現在の年齢
    expenditure: number; // 年間支出(万円)
    value: number; // 株式資産(万円)
    mu: number; // リターン
    sigma: number; // リスク
    money: number; // 預金額(万円)
    salary: number; // 給料（手取り)
    goal: number; // 年間投資額(万円)
    emergency: number; // 生活防衛費(万円)
    ratio: number; // 債権の保有率
}

interface Result {
    achieved: boolean;  // 目標金額まで貯蓄できたかどうか
    achievedYears: number; // 目標金額達成年数
    survived: boolean;
    history: { t: number, age: number, x: number, y: number, r: number }[]
}
const simulate = (props: Props): Result => {
    let res: Result = {
        achieved: false,
        achievedYears: -1,
        survived: true, // 目標の年数生き延びれたかどうか
        history: []
    };
    let x = props.value; // 初期投資額(万円)
    let y = props.money; // 現金
    let p = props.expenditure; // 年間の支出(万円)
    let q = props.salary; // 給料(手取り)
    let w = props.emergency; // 生活防衛費
    let mu = props.mu; // リターン(平均)
    let sigma = props.sigma; // リスク(標準偏差)
    let T = 50; // 何年先までシミュレーションしたいか

    for (let t = 0; t < T; ++t) {
        const age = props.age + t;
        const r = Math.max(-0.9, gauss(mu, sigma));
        if ((y < 0) || (x < 0)) {
            res.survived = false; 
            break;
        }
        // 給料
        if (!res.achieved && (x + y < props.goal)) {
            // 目標金額達成までは働く
            y += q;
        } else {
            if (!res.achieved) {
                res.achieved = true;
                res.achievedYears = t;
            }
            // 国民年金(厚生年金) + 健康保険
            if (age < 65) {
                y -= 30; 
            } else { // 年金の受け取り
                y += 100;
            }
        }
        // 債権と株式のバランス調整
        if (y < w + p) {
            y += p;
            x -= p;
        } else { // 債権の割合が一定になるよう調整
            let d = y - props.ratio * (x+y);
            y -= d;
            x += d;
        }
        // 毎年の支出
        if (y > w + p) {
            y -= p;
        } else if (x >= p) { // 資産の切り崩し
            x -= p;
        } else if ((0 < x) && (x < p)) { // 働く必要がある状態
            y -= x;
            x = 0;
        } else {
            y -= p;
        }
        // 複利
        if (x > 0) {
            x *= 1 + r;
        }
        res.history.push({ t, age, x, y, r });
    }
    return res;
}
const calcWinRatio = (results:Result[]):number => {
    let numWin = 0;
    let numTotal = 0;
    results.map(result => {
        if (result.survived) {
            ++numWin;
        }
        ++numTotal;
    });
    return numWin / numTotal;
}
const parse = (x:string):number => {
    if (x.length === 0) {
        return 0;
    } else {
        return parseInt(x);
    }
}
const sum = (v:number[]) => {
    let res = 0;
    v.map(x => {
        res += x;
    });
    return res;
}
const App = () => {
    const [age, setAge] = React.useState<number>(25);
    const [expenditure, setExpenditure] = React.useState<number>(250);  // 年間の支出
    const [salary, setSalary] = React.useState<number>(500);        // 年収(手取り)
    const [goal, setGoal] = React.useState<number>(10000);          // 目標金額(万円)
    const [money, setMoney] = React.useState<number>(300);          // 現在の預金額(万円)
    const [value, setValue] = React.useState<number>(500);         // 初期投資額
    const [mu, setMu] = React.useState<number>(0.08);              // リターン
    const [sigma, setSigma] = React.useState<number>(0.18);         // リスク
    const [emergency, setEmergency] = React.useState<number>(300);  // 生活防衛資金(万円)
    const [ratio, setRatio] = React.useState<number>(0.2);          // 預金の割合
    let results = [];
    for (let k = 0; k < 1000; ++k) {
        results.push(simulate({
            age,            // 年齢
            expenditure,    // 年間の支出
            value,          // 初期投資額
            mu,             // リターン
            sigma,          // リスク
            money,          // 預金額(万円)
            salary,         // 年収（手取り)
            goal,           // 年間投資額(万円)
            emergency,      // 生活防衛費(万円)
            ratio           // 預金の割合
        }));
    }
    const achievedYearsList = results.map(r => {
        return r.achievedYears;
    });
    const averageAchievedYears = Math.floor(sum(achievedYearsList) / achievedYearsList.length);
    const result = results[0];
    const winRatio = calcWinRatio(results);
    return (
        <div>
            <h3>資産運用シミュレーション</h3>
            <div>
                <span>現在の年齢</span>
                <span><input type="text"
                    value={age}
                    onChange={e => setAge(parse(e.target.value))}
                ></input>歳</span>
            </div>
            <div>
                <span>年間の支出</span>
                <span><input type="text"
                    value={expenditure}
                    onChange={e => setExpenditure(parse(e.target.value))}
                ></input>万円</span>
            </div>
            <div>
                <span>年収(手取り)</span>
                <span><input type="text"
                    value={salary}
                    onChange={e => setSalary(parse(e.target.value))}
                ></input>万円</span>
            </div>
            <div>
                <span>生活防衛資金</span>
                <span><input type="text"
                    value={emergency}
                    onChange={e => setEmergency(parse(e.target.value))}
                ></input>万円</span>
            </div>
            <div>
                <span>目標金額</span>
                <span><input type="text"
                    value={goal}
                    onChange={e => setGoal(parse(e.target.value))}
                ></input>万円</span>
            </div>
            <hr/>
            <div>
                <span>預金額</span>
                <span><input type="text"
                    value={money}
                    onChange={e => setMoney(parse(e.target.value))}
                ></input>万円</span>
            </div>
            <div>
                <span>初期投資額</span>
                <span><input type="text"
                    value={value}
                    onChange={e => setValue(parse(e.target.value))}
                ></input>万円</span>
            </div>
            <div>
                <span>リターン</span>
                <span><input type="text"
                    value={mu}
                    onChange={e => setMu(parseFloat(e.target.value) || 0.0001)}
                ></input>%</span>
            </div>
            <div>
                <span>リスク</span>
                <span><input type="text"
                    value={sigma}
                    onChange={e => setSigma(parseFloat(e.target.value) || 0.0001)}
                ></input>%</span>
                <span>リターンとリスクは『<a href="https://myindex.jp/data_i.php?q=SP1001JPY">myINDEX わたしのインデックス</a>』といった外部サービスを参考に決めてください。</span>
            </div>
            <div>
                <span>預金の割合</span>
                <span><input type="text"
                    value={ratio}
                    onChange={e => setRatio(parseFloat(e.target.value) || 0.0001)}
                ></input></span>
            </div>

            <hr />

            <div>
                <span>勝率:</span>
                <span style={{color:"red"}}>{Math.floor(100 * winRatio)}%</span>
                <span>(50年後に資産がマイナスにならない確率)</span>
            </div>
            <div>
                <span>平均目標達成年数:</span>
                <span>{averageAchievedYears}年</span>
            </div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>年目</th>
                            <th>歳</th>
                            <th>株式</th>
                            <th>リターン(%)</th>
                            <th>預金額</th>
                        </tr>
                    </thead>
                    <tbody>
                    {result.history.map(record => {
                        return (
                            <tr>
                                <td>{record.t}</td>
                                <td>{record.age}</td>
                                <td>{Math.floor(record.x)}</td>
                                <td>{Math.floor(100 * record.r)}</td>
                                <td>{Math.floor(record.y)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <div>当シミュレーションを利用されたことにより生じたいかなる結果についても責任を負いません。</div>
        </div>
    );
}

export default App;
