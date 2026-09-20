// Google Ads Script — Offline Conversion Backfill Upload
// Paste into Google Ads → Tools → Bulk actions → Scripts → New script
// Click Run → Authorize → check Tools → Bulk actions → Uploads for per-row results.
//
// Uploads 13 historical click conversions to the "Purchase (offline)"
// conversion action via AdsApp.bulkUploads(). Mutates nothing else in the
// account — no campaigns, bids, budgets, or conversion-action settings.
//
// Dedupe-safe: Google Ads deduplicates by (gclid, conversion action,
// conversion date-time). Re-running produces the same result.
//
// Times are account-timezone wall clock (America/New_York). The original
// -04:00 offsets (EDT) have been stripped — identical instants.

function main() {
  var columns = [
    'Google Click ID',
    'Conversion Name',
    'Conversion Time',
    'Conversion Value',
    'Conversion Currency Code'
  ];

  var rows = [
    { gclid: 'Cj0KCQjwzY7VBhDwARIsAFtPvBRVQIxBE_kNJ7AJh1nlicHso90hlKO5lxzMlxQ4KWFTf02qTV-t2WkaAtguEALw_wcB',
      time: '2026-09-11 22:12:15', value: 288 },
    { gclid: 'CjwKCAjw2aPVBhBkEiwA0Cpttxm0PxmmDmm_vh5JhxAPm7fQC3HIZRW8hCpGI44rKlktbvj4BtTBqhoCyGgQAvD_BwE',
      time: '2026-09-15 18:11:50', value: 249 },
    { gclid: 'Cj0KCQjw8JPVBhD-ARIsAO691sHtqqo-dWnJM-tdj11FNxY564j2xg1yswVvQs9npo0o5puJagKOfDgaAkadEALw_wcB',
      time: '2026-09-12 17:50:32', value: 249 },
    { gclid: 'Cj0KCQjwzY7VBhDwARIsAFtPvBQxk6_bSbbZHl53LcKAFXHmclp8ULJ3yLQCN0kSXa5Y6DmLXuXgwY8aAlEwEALw_wcB',
      time: '2026-09-11 17:23:02', value: 249 },
    { gclid: 'CjwKCAjwqonVBhA4EiwA9wYJ3d8s9LsMdNlae3NmLxJJP7TwjWEbQ4-WWBssa6xpYscs_uAdN0EUlxoCp-wQAvD_BwE',
      time: '2026-09-11 12:46:29', value: 249 },
    { gclid: 'CjwKCAjwwfnUBhAtEiwAfQpAYtXM0fMJjmmf9ylqSp-vPB2m3hWSCA9fT2NmP17TZkZTqbrHbT4j0xoCaT0QAvD_BwE',
      time: '2026-09-13 19:47:49', value: 307 },
    { gclid: 'CjwKCAjwqonVBhA4EiwA9wYJ3ZAMRdpDRhuWCz5Blai3LCouP_J-l45tLBRO1g-F7sDGQNJrTQ8LaxoC6D8QAvD_BwE',
      time: '2026-09-15 09:46:37', value: 249 },
    { gclid: 'CjwKCAjwwfnUBhAtEiwAfQpAYj6gWBoSND1kB27techw7QXf_86D_P2XhOMJVmmnPHGCRu7sw-7qJRoCBrEQAvD_BwE',
      time: '2026-09-08 15:43:39', value: 268 },
    { gclid: 'CjwKCAjwqonVBhA4EiwA9wYJ3cZ-5e_Rn-kxyyIuVBNWi0SC-SpvrRhPVgRF8WOn0DhDoeJtf2E1XxoC8iIQAvD_BwE',
      time: '2026-09-10 14:02:36', value: 268 },
    { gclid: 'CjwKCAjw2aPVBhBkEiwA0Cptty_DpbdJzWxekcC4RrVWFrJsauPxsUirpMLlBcVbd45Niak5ysBrshoCwjUQAvD_BwE',
      time: '2026-09-16 01:43:13', value: 249 },
    { gclid: 'CjwKCAjwn67VBhBnEiwAXUIN1d_MF0LCggKacRmoYJXd8D5EinBYrqAwcSq801Ay2Pwsf7ncx8uAUhoCFm0QAvD_BwE',
      time: '2026-09-17 23:41:42', value: 249 },
    { gclid: 'Cj0KCQjw5bjVBhCiARIsAJzMVnRQet16agAmxjOlskbQ94cwV5Lg3XGV_TCHHYir3vfj452E0VrD0bYaAgwmEALw_wcB',
      time: '2026-09-19 23:16:24', value: 249 },
    { gclid: 'CjwKCAjw_KjVBhAHEiwAnC0N9BexijUV560pGf3y7u5GaaGSHt4CWsndv4wubBWc-BcTRxL-o2vZlBoChkgQAvD_BwE',
      time: '2026-09-20 13:02:19', value: 288 },
  ];

  Logger.log('Submitting ' + rows.length + ' conversions via bulkUploads...');

  var upload = AdsApp.bulkUploads().newCsvUpload(columns, {moneyInMicros: false});

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    upload.append({
      'Google Click ID': r.gclid,
      'Conversion Name': 'Purchase (offline)',
      'Conversion Time': r.time,
      'Conversion Value': r.value,
      'Conversion Currency Code': 'USD'
    });
  }

  upload.forOfflineConversions();
  upload.apply();

  Logger.log('Upload submitted: ' + rows.length + ' rows.');
  Logger.log('Per-row results: Google Ads → Tools → Bulk actions → Uploads');
}
