module ApplicationHelper
  def full_title(page_title = '')
    base_title = "Potara"
    if page_title.empty?
      base_title
    else
      "#{page_title} | #{base_title}"
    end
  end

  def default_meta_tags
    def default_meta_tags
      {
        site: 'Potara(ポタラ)',
        title: '超リアル派マッチングアプリで、指先の恋からさようなら',
        reverse: true,
        separator: '|',
        description: 'リアルタイムで次々とマッチングされていく新感覚マッチングアプリです。',
        keywords: 'Potara,ポタラ,リアル,リアルタイム,マッチングアプリ,新アプリ,出会い,恋愛',
        canonical: ENV['APP_URL'],
        icon: [
          { href: image_url('logo.png') },
          { href: image_url('logo.png'), rel: 'apple-touch-icon', sizes: '180x180', type: 'image/png' },
        ],
        og: {
          site_name: 'Potara(ポタラ)',
          title: '超リアル派マッチングアプリで、指先の恋からさようなら',
          description: 'リアルタイムで次々とマッチングされていく新感覚マッチングアプリです。',
          type: 'website',
          url: ENV['APP_URL'],
          image: image_url('tissue.png'),
          locale: 'ja_JP',
        }
      }
    end
  end
end
