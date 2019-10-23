array=(hackerone.net hacker101.com hackerone-user-content.com greenhouse.io periscope.tv gnip.com mobpub.com pscp.tv twimg.com vine.co hackerone.net hacker101.com hackerone-user-content.com hackerone-ext-content.com bitmoji.com bitstrips.com)
for item in ${array[*]}
do
    echo "AMASS PASSIVE MODE"
    amass enum -passive -o /home/hemachand/temp/amass_${item}_1_t4.txt -d ${item} -timeout 10 > /dev/null
    echo "AMASS PASSIVE MODE WITH WORDLIST"
    amass enum -passive -o /home/hemachand/temp/amass_${item}_5_t4.txt -w /home/hemachand/temp/words1.txt -d ${item} -timeout 10 > /dev/null
    echo "AMASS PASSIVE MODE WITH WORDLIST AND ALTERATIONS"
    amass enum -passive -o /home/hemachand/temp/amass_${item}_8_t4.txt -aw /home/hemachand/temp/words1.txt -d ${item} -timeout 10 > /dev/null
done
    echo "Completed Passive mode successfully"
cp -rf amass* /home/hemachand/output/
cd /home/hemachand/output
git pull
git add .
git commit -m "temp1"
git push -f https://hemachandsai:11371026%40saiI@github.com/hemachandsai/output.git
for item in ${array[*]}
do
    echo "AMASS ACTIVE MODE"
    amass enum -active -o /home/hemachand/temp/amass_${item}_2_t4.txt -d ${item} -timeout 15 > /dev/null
    echo "AMASS ACTIVE MODE WITH WORDLIST"
    amass enum -active -o /home/hemachand/temp/amass_${item}_4_t4.txt -w /home/hemachand/temp/words1.txt -d ${item} -timeout 15 > /dev/null
    echo "AMASS ACTIVE MODE WITH WORDLIST AND ALTERATIONS"
    amass enum -active -o /home/hemachand/temp/amass_${item}_7_t4.txt -aw /home/hemachand/temp/words1.txt -d ${item} -timeout 15 > /dev/null
done
    echo "Completed Active mode successfully"
cp -rf amass* /home/hemachand/output/
cd /home/hemachand/output
git pull
git add .
git commit -m "temp1"
git push -f https://hemachandsai:11371026%40saiI@github.com/hemachandsai/output.git
for item in ${array[*]}
do
    echo "AMASS BRUTE MODE"
    amass enum -brute -o /home/hemachand/temp/amass_${item}_3_t4.txt -d ${item} -timeout 30 > /dev/null
    echo "AMASS BRUTE MODE MITH WORDLIST"
    amass enum -brute -o /home/hemachand/temp/amass_${item}_6_t4.txt -w /home/hemachand/temp/words1.txt -d ${item} -timeout 30 > /dev/null
    echo "AMASS BRUTE MODE WITH WORDLIST AND ALTERATIONS"
    amass enum -brute -o /home/hemachand/temp/amass_${item}_9_t4.txt -aw /home/hemachand/temp/words1.txt -d ${item} -timeout 30 > /dev/null
done
    echo "Completed Brute mode successfully"
cp -rf amass* /home/hemachand/output/
cd /home/hemachand/output
git pull
git add .
git commit -m "temp1"
git push -f https://hemachandsai:11371026%40saiI@github.com/hemachandsai/output.git








