async function openSearch(wikiURL: string, searchString: string) {
    let query = `?action=opensearch&limit=10type=json&redirects=resolve&search=${searchString}`
    let url = wikiURL + query
    let resp = await fetch(url)
    return await resp.json()
}

export async function searchExplainxkcd(searchString: string): Promise<string> {
    let json = await openSearch('https://www.explainxkcd.com/wiki/api.php',searchString)

    let [search, names, _, urls] = json
    let result = `Search results for \`${search}\`:\n`

    for (let i in names) {
        let url = (await fetch(urls[i])).url
        let id = url.split('/').slice(-1)[0].split(':')[0]
        let xkcdUrl = `<https://xkcd.com/${id}/>`
        result += `[${names[i]}](${xkcdUrl})\n`
    }
    return result
}
