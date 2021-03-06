import datetime
import json

from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render, redirect

# Create your views here.
from django.views.decorators.csrf import csrf_exempt

from Card.models import Card, MemoryInfo
from Deck.models import Deck, DeckInfo, ShareInfo, CopyInfo
from Login.models import User
from StudyGroup.models import StudyGroup, Chat
from uuid import uuid4
from itertools import chain


# 访问卡组页面
def go_deck(request):
    if not request.session.get('status'):
        return redirect("/auth/login_page")
    return render(request, 'Deck/deck.html')


# 删除卡组
@csrf_exempt
def delete_deck(request):
    if not request.session.get('status'):
        return redirect("/auth/login_page")
    deck_id = request.POST.get('deck_id')
    user = User.objects.get(user_name=request.session['username'])
    deck = user.deck_set.get(deck_id=deck_id)
    ret = {'status': True}
    # 需要creator权限
    if user.user_id == deck.creator.user_id:
        deck.delete()
    else:
        ret['status'] = False
        ret['data'] = 'Insufficient permissions'
    return HttpResponse(json.dumps(ret))


# 创建卡组
@csrf_exempt
def create_deck(request):
    if not request.session.get('status'):
        return redirect("/auth/login_page")
    new_deck_name = request.POST.get('deck_name')

    ret = {'status': True}
    # 获取该用户创建的所有卡组
    user = User.objects.get(user_name=request.session['username'])
    decks = user.deck_set.all()
    # 判断该用户是否已经创过相应的卡组了,如果有，返回添加失败的信息
    for deck in decks:
        if deck.name == new_deck_name:
            ret['status'] = False
            ret['data'] = "Already has a set of Deck with the same name"
            return HttpResponse(json.dumps(ret))

    new_deck = Deck(name=new_deck_name, creator=user)
    new_deck.save()
    new_deck_info = DeckInfo(deck=new_deck, user=user)
    new_deck_info.save()
    ret['data'] = {'deck_name': new_deck.name, 'deck_id': new_deck.deck_id, 'deck_amount': 0}
    return HttpResponse(json.dumps(ret))


# 获取与用户有关的所有卡组
@csrf_exempt
def get_decks(request):
    if not request.session.get('status'):
        return redirect("/auth/login_page")
    user_name = request.session['username']
    user = User.objects.get(user_name=user_name)
    decks = get_more_decks(request)

    my_decks = []
    for deck in decks:
        deck_info = DeckInfo.objects.get(user__user_id=user.user_id, deck__deck_id=deck.deck_id)
        review_nums = deck_info.need_review_nums - deck_info.now_review_nums
        my_decks.append(
            {'deck_id': deck.deck_id, 'deck_name': deck.name, 'card_amount': deck.amount, 'review_nums': review_nums})
    ret = {'status': True, 'data': my_decks}
    return HttpResponse(json.dumps(ret))


# 创建共享邀请码
@csrf_exempt
def set_share_code(request):
    deck = Deck.objects.get(deck_id=request.POST.get('deck_id'))
    password = request.POST.get('share_password')
    code = uuid4()
    new_share_info = ShareInfo(share_code=code, share_password=password, deck=deck)
    new_share_info.save()
    ret = {'status': True, 'data': {'share_id': new_share_info.share_id,
                                    'share_code': str(code), 'share_password': password}}
    return HttpResponse(json.dumps(ret))


# 创建拷贝邀请码
@csrf_exempt
def set_copy_code(request):
    deck = Deck.objects.get(deck_id=request.session['deck_id'])
    code = uuid4()
    new_copy_info = CopyInfo(copy_code=code, deck=deck)
    new_copy_info.save()
    ret = {'status': True, 'data': {'copy_id': new_copy_info.copy_code, 'copy_code': code}}
    return HttpResponse(json.dumps(ret))


# 关闭共享邀请码
@csrf_exempt
def delete_share_code(request):
    share_id = request.POST.get('share_id')
    ShareInfo.objects.filter(share_id=share_id).delete()
    ret = {'status': True}
    return HttpResponse(json.dumps(ret))


@csrf_exempt
def delete_copy_code(request):
    copy_id = request.POST.get('copy_id')
    CopyInfo.objects.filter(copy_id=copy_id).delete()
    ret = {'status': True}
    return HttpResponse(json.dumps(ret))


# 查找该卡组所有Share邀请
@csrf_exempt
def get_share_codes(request):
    deck = Deck.objects.get(deck_id=request.session['deck_id'])
    infos = ShareInfo.objects.get(deck=deck)
    ret = {'status': True}
    if infos.exist():
        ret['data'] = list(infos)
    else:
        ret['status'] = False
    return HttpResponse(json.dumps(ret))


# 查找该卡组所有Copy邀请
@csrf_exempt
def get_copy_codes(request):
    deck = Deck.objects.get(deck_id=request.session['deck_id'])
    infos = CopyInfo.objects.get(deck=deck)
    ret = {'status': True}
    if infos.exist():
        ret['data'] = list(infos)
    else:
        ret['status'] = False
    return HttpResponse(json.dumps(ret))


# 使用Share邀请
@csrf_exempt
def share_deck(request):
    user = User.objects.get(user_name=request.session['username'])
    code = request.POST.get('share_code')
    password = request.POST.get('share_password')
    ret = {'status': True}
    try:
        share_info = ShareInfo.objects.get(share_code=code, share_password=password)
    except:
        ret['status'] = False
        return HttpResponse(json.dumps(ret))

    deck = share_info.deck
    deck.staffs.add(user)
    deck.save()
    new_deck_info = DeckInfo(deck=deck, user=user, need_review_nums=deck.amount)
    new_deck_info.save()
    # 卡片的复习信息也要创建
    cards = deck.card_set.all()
    for card in cards:
        new_memory_info = MemoryInfo(user_id=user.user_id, card_id=card.card_id,
                                     review_time=datetime.date.today())
        new_memory_info.save()

    group = StudyGroup.objects.filter(deck_id=deck.deck_id)
    if not group.exists():
        new_study_group = StudyGroup(group_name=code, deck_id=deck.deck_id)
        new_study_group.save()

    ret['data'] = {'deck_name': deck.name, 'deck_id': deck.deck_id, 'deck_amount': deck.amount}
    return HttpResponse(json.dumps(ret))


# 使用Copy邀请
@csrf_exempt
def copy_deck(request):
    user = User.objects.get(user_name=request.session['username'])
    code = request.POST.get('copy_code')
    ret = {'status': True}
    try:
        copy_info = CopyInfo.objects.get(copy_code=code)
    except:
        ret['status'] = False
        ret['data'] = 'Can not find the deck by code'
        return HttpResponse(json.dumps(ret))
    deck = copy_info.deck
    new_deck = Deck(name=deck.name, amount=deck.amount, creator=user, today_learn_nums=deck.amount)
    new_deck.save()
    new_deck_info = DeckInfo(deck=new_deck, user=user, need_review_nums=deck.amount)
    new_deck_info.save()
    cards = Card.objects.filter(deck=deck)
    for card in cards:
        new_card = Card(q_text=card.q_text, q_img=card.q_img, ans_text=card.ans_text,
                        ans_img=card.ans_img, deck=new_deck)
        new_card.save()
        new_memory_info = MemoryInfo(card=new_card, user=user)
        new_memory_info.save()
    ret['data'] = {'deck_name': new_deck.name, 'deck_id': new_deck.deck_id, 'deck_amount': new_deck.amount}
    return HttpResponse(json.dumps(ret))


# 返回多种权限的deck
def get_more_decks(request):
    user_name = request.session['username']
    # 获取该用户创建的所有卡组 creator_decks, admin_decks, staff_decks
    user = User.objects.get(user_name=user_name)
    creator_decks = user.deck_set.filter(is_public=False)
    admin_decks = user.AdminsToDeck.filter(is_public=False).difference(creator_decks)
    staff_decks = user.StaffsToDeck.filter(is_public=False).difference(admin_decks).difference(creator_decks)
    decks = chain(creator_decks, admin_decks, staff_decks)
    return decks


# 定时任务，重设review_nums
def reset_review():
    # DeckInfo相关操作
    DeckInfo.objects.update(now_review_nums=0)
    deck_infos = DeckInfo.objects.all()
    for deck_info in deck_infos:
        deck = deck_info.deck
        review_infos_count = MemoryInfo.objects.filter(user__user_name=deck_info.user.user_name,
                                                       card__deck__deck_id=deck.deck_id,
                                                       review_time__lte=datetime.date.today()).count()
        # print(review_infos_count)
        # print(deck_info.deck.today_learn_nums)
        # print(deck_info.need_review_nums)
        deck_info.need_review_nums = review_infos_count
        deck_info.save()
    # Deck相关操作
    Deck.objects.update(today_learn_nums=0)


# 定时任务，删除过期邀请码
def delete_old_code():
    delete_day = datetime.date.today() - datetime.timedelta(days=3)
    ShareInfo.objects.filter(c_time__lte=delete_day).delete()
    CopyInfo.objects.filter(c_time__lte=delete_day).delete()
