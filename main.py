import requests


response = requests.get("https://latest.pokewiki.net/ポットデス")

print("###########")
print("## value ##")
print("###########")
value = response.text
value = value[value.find("content_1_0"):value.find("ばつぐん"):]
value = value.split("</tr>")
value = value[1]
value = value.split("</td>")
value = value[1:8]
value_tmp = []
for v in value:
    v = v.split(">")
    v = v[1]
    value_tmp.append(v)
value = value_tmp
for v in value:
    print(v)

print("##########")
print("## move ##")
print("##########")
move = response.text
move = move[move.find("content_1_2"):move.find("content_1_3")]
move = move.replace('class="style_td"', '')
move = move.replace('style="text-align:center;', '')
move = move.replace('<tr>', '')
move = move.split("</tr>")
move = move[1:]
tmp = []
for m in move:
    if "解説" in m:
        continue
    m = m.replace('<td >', '')
    m = m.replace('<td  ">', '')
    m = m.replace('<td  colspan="2" ">', '')
    m = m.split('</td>')
    tmp.append(m[:3])
move = tmp
# print(move)
for m in move:
    print(m)